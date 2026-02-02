import { Controller, Get, Query, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { SseService } from './sse.service';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Get('events')
  handleSse(
    @Query('device_code') deviceCode: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    if (!deviceCode) {
      res.status(400).send('device_code is required');
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    this.sseService.registerConnection(deviceCode, res);

    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
      // @ts-ignore
      if (typeof res.flush === 'function') res.flush();
    }, 30000);

    // Initial message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    req.on('close', () => {
      clearInterval(heartbeat);
      this.sseService.unregisterConnection(deviceCode);
    });
  }
}
