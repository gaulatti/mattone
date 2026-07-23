const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export type TelemetryPlatform = 'web';

export type TelemetryEventType =
  | 'playback_start'
  | 'playback_stop'
  | 'playback_error'
  | 'playback_failure'
  | 'buffering_start'
  | 'buffering_end'
  | 'decoder_initialized'
  | 'bitrate_changed'
  | 'frontend_event';

export interface TelemetryEvent {
  platform: TelemetryPlatform;
  eventType: TelemetryEventType;
  deviceCode?: string;
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
}

let enabled = true;

export function setTelemetryEnabled(value: boolean): void {
  enabled = value;
}

export function isTelemetryEnabled(): boolean {
  return enabled;
}

export function reportTelemetry(event: TelemetryEvent): void {
  if (!enabled) return;

  const payload: TelemetryEvent = {
    ...event,
    platform: 'web',
  };

  fetch(`${API_BASE_URL}/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((error) => {
    // Silent fail: telemetry must never break the app.
    if (import.meta.env.DEV) {
      console.debug('Telemetry report failed', error);
    }
  });
}

export function reportFrontendEvent(
  eventName: string,
  page: string,
  metadata?: Record<string, unknown>
): void {
  reportTelemetry({
    platform: 'web',
    eventType: 'frontend_event',
    metadata: { eventName, page, ...metadata },
  });
}

export function reportPlaybackStart(
  streamName: string,
  layoutMode: 'single' | 'quad' = 'single',
  quadrant?: number
): void {
  reportTelemetry({
    platform: 'web',
    eventType: 'playback_start',
    streamName,
    layoutMode,
    quadrant,
  });
}

export function reportPlaybackStop(
  streamName: string,
  layoutMode: 'single' | 'quad' = 'single',
  quadrant?: number
): void {
  reportTelemetry({
    platform: 'web',
    eventType: 'playback_stop',
    streamName,
    layoutMode,
    quadrant,
  });
}

export function reportPlaybackError(
  streamName: string,
  errorCode: string,
  errorReason?: string,
  layoutMode: 'single' | 'quad' = 'single',
  quadrant?: number
): void {
  reportTelemetry({
    platform: 'web',
    eventType: 'playback_error',
    streamName,
    errorCode,
    errorReason,
    layoutMode,
    quadrant,
  });
}

export function reportDecoderInitialized(
  decoderType: 'hardware' | 'software' | 'unknown',
  decoderName: string
): void {
  reportTelemetry({
    platform: 'web',
    eventType: 'decoder_initialized',
    decoderType,
    decoderName,
  });
}

export function reportBitrateChanged(
  streamName: string,
  bitrate: number,
  decoderType: 'hardware' | 'software' | 'unknown' = 'unknown'
): void {
  reportTelemetry({
    platform: 'web',
    eventType: 'bitrate_changed',
    streamName,
    bitrate,
    decoderType,
  });
}
