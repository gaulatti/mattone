import { Controller, Get, Query, Res, Req } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { SseService } from './sse.service';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Get('events')
  async handleSse(
    @Query('device_code') deviceCode: string,
    @Res({ passthrough: false }) res: FastifyReply,
    @Req() req: FastifyRequest,
  ): Promise<void> {
    if (!deviceCode) {
      res.status(400).send('device_code is required');
      return;
    }

    // Hijack the connection for SSE
    res.hijack();
    const stream = res.raw;

    stream.setHeader('Content-Type', 'text/event-stream');
    stream.setHeader('Cache-Control', 'no-cache');
    stream.setHeader('Connection', 'keep-alive');
    stream.setHeader('Access-Control-Allow-Origin', '*');
    stream.write('\n');

    this.sseService.registerConnection(deviceCode, stream);

    const heartbeat = setInterval(() => {
      stream.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
    }, 30000);

    // Initial message
    stream.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    stream.on('close', () => {
      clearInterval(heartbeat);
      this.sseService.unregisterConnection(deviceCode);
    });
  }
}
