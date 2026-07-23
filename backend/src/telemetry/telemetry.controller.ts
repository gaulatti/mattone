import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Res,
  HttpCode,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { TelemetryService } from './telemetry.service';
import { TelemetryEventDto } from './dto/telemetry-event.dto';

@Controller()
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get('metrics')
  async metrics(@Res() res: FastifyReply) {
    res.header('Content-Type', this.telemetryService.contentType());
    res.send(await this.telemetryService.getMetrics());
  }

  @Post('telemetry')
  @HttpCode(202)
  telemetry(
    @Body() event: TelemetryEventDto,
    @Headers('X-Device-ID') deviceIdHeader?: string,
    @Headers('X-Platform') platformHeader?: string,
  ) {
    // Allow the client to omit deviceCode when it already sends X-Device-ID.
    if (!event.deviceCode && deviceIdHeader) {
      event.deviceCode = deviceIdHeader;
    }
    // Header can override platform for convenience in generic clients.
    if (platformHeader && !event.platform) {
      const allowed: Array<TelemetryEventDto['platform']> = [
        'ios',
        'android',
        'web',
        'backend',
      ];
      if (allowed.includes(platformHeader as TelemetryEventDto['platform'])) {
        event.platform = platformHeader as TelemetryEventDto['platform'];
      }
    }

    this.telemetryService.recordEvent(event);
    return { status: 'recorded' };
  }
}
