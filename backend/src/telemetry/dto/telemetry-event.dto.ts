import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsObject,
} from 'class-validator';

export class TelemetryEventDto {
  @IsString()
  @IsOptional()
  deviceCode?: string;

  @IsEnum(['ios', 'android', 'web', 'backend'])
  platform: 'ios' | 'android' | 'web' | 'backend';

  @IsEnum([
    'playback_start',
    'playback_stop',
    'playback_error',
    'playback_failure',
    'buffering_start',
    'buffering_end',
    'decoder_initialized',
    'decoder_init_result',
    'bitrate_changed',
    'frontend_event',
    'api_request',
  ])
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

  @IsString()
  @IsOptional()
  streamName?: string;

  @IsString()
  @IsOptional()
  streamUrl?: string;

  @IsNumber()
  @IsOptional()
  quadrant?: number;

  @IsEnum(['single', 'quad'])
  @IsOptional()
  layoutMode?: 'single' | 'quad';

  @IsEnum(['hardware', 'software', 'unknown'])
  @IsOptional()
  decoderType?: 'hardware' | 'software' | 'unknown';

  @IsString()
  @IsOptional()
  decoderName?: string;

  @IsNumber()
  @IsOptional()
  bitrate?: number;

  @IsString()
  @IsOptional()
  errorCode?: string;

  @IsString()
  @IsOptional()
  errorReason?: string;

  @IsNumber()
  @IsOptional()
  durationMs?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
