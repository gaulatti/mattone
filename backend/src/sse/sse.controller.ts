import {
  BadRequestException,
  Controller,
  MessageEvent,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable, interval, merge } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { SseService } from './sse.service';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('events')
  handleSse(
    @Query('device_code') deviceCode: string,
  ): Observable<MessageEvent> {
    if (!deviceCode) {
      throw new BadRequestException('device_code is required');
    }

    // Register the device and get its message stream
    const messageStream$ = this.sseService.getMessageStream(deviceCode);
    const disconnect$ = this.sseService.getDisconnectStream(deviceCode);

    // Create heartbeat stream (every 30 seconds)
    const heartbeat$ = interval(30000).pipe(
      map(() => ({ data: { type: 'heartbeat' } }) as MessageEvent),
    );

    // Send initial connected message
    const connected$ = new Observable<MessageEvent>((subscriber) => {
      subscriber.next({ data: { type: 'connected' } } as MessageEvent);
    });

    // Merge all streams and stop on disconnect
    return merge(connected$, heartbeat$, messageStream$).pipe(
      takeUntil(disconnect$),
    );
  }
}
