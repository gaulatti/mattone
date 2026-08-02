import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { ChannelReliabilityEvent } from '../entities/channel-reliability-event.entity';

export interface TelemetryEvent {
  deviceCode?: string;
  platform: 'ios' | 'android' | 'web' | 'backend';
  eventType:
    | 'playback_start'
    | 'playback_stop'
    | 'playback_error'
    | 'playback_failure'
    | 'buffering_start'
    | 'buffering_end'
    | 'decoder_initialized'
    | 'decoder_init_result'
    | 'bitrate_changed'
    | 'frontend_event'
    | 'api_request';
  streamName?: string;
  streamUrl?: string;
  quadrant?: number;
  layoutMode?: 'single' | 'quad';
  decoderType?: 'hardware' | 'software' | 'unknown';
  decoderName?: string;
  bitrate?: number;
  errorCode?: string;
  errorReason?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  channelId?: string;
}

@Injectable()
export class TelemetryService implements OnModuleInit {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly register = new client.Registry();

  // Playback lifecycle
  private readonly playbackStarts: client.Counter<'platform' | 'layout_mode'>;
  private readonly playbackStops: client.Counter<'platform' | 'layout_mode'>;
  private readonly playbackFailures: client.Counter<
    'platform' | 'reason' | 'layout_mode'
  >;
  private readonly playbackErrors: client.Counter<
    'platform' | 'error_code' | 'layout_mode'
  >;

  // Bitrate / quality
  private readonly bitrateGauge: client.Gauge<
    'device_code' | 'platform' | 'decoder_type' | 'stream_name'
  >;

  // Buffering
  private readonly bufferingEvents: client.Counter<
    'platform' | 'layout_mode' | 'transition'
  >;
  private readonly bufferingDuration: client.Histogram<
    'platform' | 'layout_mode'
  >;
  private readonly bufferingStartTimes = new Map<string, number>();

    // Decoder
  private readonly decoderInitializations: client.Counter<
    'platform' | 'decoder_type' | 'decoder_name'
  >;
  private readonly decoderInitResults: client.Counter<
    'platform' | 'decoder_type' | 'success' | 'layout_mode'
  >;
  private readonly activeDecoders: client.Gauge<
    'device_code' | 'decoder_type' | 'scope'
  >;

  // SSE / device connectivity
  private readonly activeConnections: client.Gauge<'device_code' | 'platform'>;
  private readonly connectionEvents: client.Counter<
    'device_code' | 'platform' | 'event'
  >;

  // API / frontend
  private readonly apiRequests: client.Counter<
    'method' | 'route' | 'status_code'
  >;
  private readonly apiRequestDuration: client.Histogram<
    'method' | 'route' | 'status_code'
  >;
  private readonly frontendEvents: client.Counter<'event_name' | 'page'>;

  constructor(@InjectRepository(Channel) private channels: Repository<Channel>, @InjectRepository(ChannelReliabilityEvent) private reliabilityEvents: Repository<ChannelReliabilityEvent>) {
    client.collectDefaultMetrics({ register: this.register });

    this.playbackStarts = new client.Counter({
      name: 'celesti_playback_starts_total',
      help: 'Total number of playback start events',
      labelNames: ['platform', 'layout_mode'],
      registers: [this.register],
    });

    this.playbackStops = new client.Counter({
      name: 'celesti_playback_stops_total',
      help: 'Total number of playback stop events',
      labelNames: ['platform', 'layout_mode'],
      registers: [this.register],
    });

    this.playbackFailures = new client.Counter({
      name: 'celesti_playback_failures_total',
      help: 'Total number of playback failure events (unrecoverable)',
      labelNames: ['platform', 'reason', 'layout_mode'],
      registers: [this.register],
    });

    this.playbackErrors = new client.Counter({
      name: 'celesti_playback_errors_total',
      help: 'Total number of playback error events',
      labelNames: ['platform', 'error_code', 'layout_mode'],
      registers: [this.register],
    });

    this.bitrateGauge = new client.Gauge({
      name: 'celesti_playback_bitrate_bps',
      help: 'Current playback bitrate in bits per second',
      labelNames: ['device_code', 'platform', 'decoder_type', 'stream_name'],
      registers: [this.register],
    });

    this.bufferingEvents = new client.Counter({
      name: 'celesti_buffering_events_total',
      help: 'Total number of buffering state transitions',
      labelNames: ['platform', 'layout_mode', 'transition'],
      registers: [this.register],
    });

    this.bufferingDuration = new client.Histogram({
      name: 'celesti_buffering_duration_seconds',
      help: 'Duration of buffering events in seconds',
      labelNames: ['platform', 'layout_mode'],
      buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.register],
    });

    this.decoderInitializations = new client.Counter({
      name: 'celesti_decoder_initializations_total',
      help: 'Total number of decoder initializations',
      labelNames: ['platform', 'decoder_type', 'decoder_name'],
      registers: [this.register],
    });

    this.decoderInitResults = new client.Counter({
      name: 'celesti_decoder_init_results_total',
      help: 'Total number of decoder initialization attempts with result',
      labelNames: ['platform', 'decoder_type', 'success', 'layout_mode'],
      registers: [this.register],
    });

    this.activeDecoders = new client.Gauge({
      name: 'celesti_active_decoders',
      help: 'Simultaneous hardware/software decoders reported per device',
      labelNames: ['device_code', 'decoder_type', 'scope'],
      registers: [this.register],
    });

    this.activeConnections = new client.Gauge({
      name: 'celesti_sse_active_connections',
      help: 'Number of active SSE connections',
      labelNames: ['device_code', 'platform'],
      registers: [this.register],
    });

    this.connectionEvents = new client.Counter({
      name: 'celesti_sse_connection_events_total',
      help: 'SSE connect/disconnect events',
      labelNames: ['device_code', 'platform', 'event'],
      registers: [this.register],
    });

    this.apiRequests = new client.Counter({
      name: 'celesti_api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.apiRequestDuration = new client.Histogram({
      name: 'celesti_api_request_duration_seconds',
      help: 'API request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    this.frontendEvents = new client.Counter({
      name: 'celesti_frontend_events_total',
      help: 'Frontend telemetry events',
      labelNames: ['event_name', 'page'],
      registers: [this.register],
    });
  }

  onModuleInit() {
    this.logger.log('Telemetry service initialized with Prometheus registry');
  }

  getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  contentType(): string {
    return this.register.contentType;
  }

  recordEvent(event: TelemetryEvent): void {
    void this.recordReliability(event);
    const layoutMode = event.layoutMode ?? 'single';

    switch (event.eventType) {
      case 'playback_start':
        this.playbackStarts.inc({
          platform: event.platform,
          layout_mode: layoutMode,
        });
        break;

      case 'playback_stop':
        this.playbackStops.inc({
          platform: event.platform,
          layout_mode: layoutMode,
        });
        this.clearBitrateForDevice(
          event.deviceCode,
          event.platform,
          event.quadrant,
        );
        this.flushBufferingDuration(event);
        break;

      case 'playback_failure':
        this.playbackFailures.inc({
          platform: event.platform,
          reason: event.errorReason ?? 'unknown',
          layout_mode: layoutMode,
        });
        this.flushBufferingDuration(event);
        break;

      case 'playback_error':
        this.playbackErrors.inc({
          platform: event.platform,
          error_code: event.errorCode ?? 'unknown',
          layout_mode: layoutMode,
        });
        break;

      case 'buffering_start':
        this.bufferingEvents.inc({
          platform: event.platform,
          layout_mode: layoutMode,
          transition: 'start',
        });
        this.bufferingStartTimes.set(this.bufferKey(event), Date.now());
        break;

      case 'buffering_end':
        this.bufferingEvents.inc({
          platform: event.platform,
          layout_mode: layoutMode,
          transition: 'end',
        });
        this.flushBufferingDuration(event);
        break;

      case 'decoder_initialized':
        this.decoderInitializations.inc({
          platform: event.platform,
          decoder_type: event.decoderType ?? 'unknown',
          decoder_name: event.decoderName ?? 'unknown',
        });
        break;

      case 'decoder_init_result':
        this.decoderInitResults.inc({
          platform: event.platform,
          decoder_type: event.decoderType ?? 'unknown',
          success: String(event.metadata?.success ?? 'false'),
          layout_mode: layoutMode,
        });
        this.recordActiveDecoders(event);
        break;

      case 'bitrate_changed':
        if (event.bitrate !== undefined) {
          this.bitrateGauge.set(
            {
              device_code: event.deviceCode ?? 'unknown',
              platform: event.platform,
              decoder_type: event.decoderType ?? 'unknown',
              stream_name: event.streamName ?? 'unknown',
            },
            event.bitrate,
          );
        }
        break;

      case 'frontend_event':
        this.frontendEvents.inc({
          event_name: (event.metadata?.eventName as string) ?? 'unknown',
          page: (event.metadata?.page as string) ?? 'unknown',
        });
        break;

      default:
        this.logger.debug(`Unhandled telemetry event: ${event.eventType}`);
    }
  }

  private async recordReliability(event: TelemetryEvent): Promise<void> {
    if (!event.channelId) return;
    const status = event.eventType === 'playback_start' ? 'green' : event.eventType === 'playback_failure' ? 'blocked' : event.eventType === 'playback_error' ? 'warning' : null;
    if (!status) return;
    const channel = await this.channels.findOneBy({ id: event.channelId });
    if (!channel) return;
    channel.reliabilityStatus = status;
    channel.reliabilityUpdatedAt = new Date();
    await this.channels.save(channel);
    await this.reliabilityEvents.save(this.reliabilityEvents.create({ channelId: channel.id, status, deviceCode: event.deviceCode, errorCode: event.errorCode, reason: event.errorReason }));
  }

  recordConnection(
    deviceCode: string,
    platform: string,
    connected: boolean,
  ): void {
    this.connectionEvents.inc({
      device_code: deviceCode,
      platform,
      event: connected ? 'connect' : 'disconnect',
    });

    if (connected) {
      this.activeConnections.inc({
        device_code: deviceCode,
        platform,
      });
    } else {
      this.activeConnections.dec({
        device_code: deviceCode,
        platform,
      });
    }
  }

  recordApiRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    this.apiRequests.inc({ method, route, status_code: String(statusCode) });
    this.apiRequestDuration.observe(
      { method, route, status_code: String(statusCode) },
      durationSeconds,
    );
  }

  private recordActiveDecoders(event: TelemetryEvent): void {
    const deviceCode = event.deviceCode ?? 'unknown';
    const counts: Array<[string, string]> = [
      ['hardwareDecoders', 'hardware'],
      ['softwareDecoders', 'software'],
      ['hardwareVideoDecoders', 'hardware_video'],
      ['softwareVideoDecoders', 'software_video'],
    ];

    for (const [metaKey, scope] of counts) {
      const value = event.metadata?.[metaKey];
      const decoderType = scope.startsWith('hardware') ? 'hardware' : 'software';
      const scopeLabel = scope.endsWith('_video') ? 'video' : 'all';
      this.activeDecoders.set(
        {
          device_code: deviceCode,
          decoder_type: decoderType,
          scope: scopeLabel,
        },
        typeof value === 'number' ? value : Number(value ?? 0),
      );
    }
  }

  private bufferKey(event: TelemetryEvent): string {
    return [
      event.deviceCode ?? 'unknown',
      event.platform,
      event.quadrant ?? 0,
    ].join(':');
  }

  private flushBufferingDuration(event: TelemetryEvent): void {
    const key = this.bufferKey(event);
    const startedAt = this.bufferingStartTimes.get(key);
    if (!startedAt) return;

    const durationSeconds = (Date.now() - startedAt) / 1000;
    this.bufferingDuration.observe(
      {
        platform: event.platform,
        layout_mode: event.layoutMode ?? 'single',
      },
      durationSeconds,
    );
    this.bufferingStartTimes.delete(key);
  }

  private clearBitrateForDevice(
    deviceCode: string | undefined,
    platform: string,
    quadrant: number | undefined,
  ): void {
    if (!deviceCode) return;
    // We cannot remove a single time-series easily with prom-client; instead
    // we reset the value to 0. Use stream_name=unknown for the aggregated gauge.
    this.bitrateGauge.set(
      {
        device_code: deviceCode,
        platform,
        decoder_type: 'unknown',
        stream_name: quadrant !== undefined ? `quadrant_${quadrant}` : 'single',
      },
      0,
    );
  }
}
