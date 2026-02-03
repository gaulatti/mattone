import { Injectable, Logger } from '@nestjs/common';
import { ServerResponse } from 'http';
import { Subject } from 'rxjs';

export interface SSEMessage {
  type: string;
  [key: string]: any;
}

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  private connections: Map<string, ServerResponse> = new Map();
  public readonly connectionSubject = new Subject<string>();

  registerConnection(deviceCode: string, res: ServerResponse) {
    // If there's an existing connection, close it
    if (this.connections.has(deviceCode)) {
      this.connections.get(deviceCode)?.end();
    }

    this.connections.set(deviceCode, res);
    this.logger.log(`Device connected: ${deviceCode}`);
    this.connectionSubject.next(deviceCode);

    // Remove connection on close
    res.on('close', () => {
      this.unregisterConnection(deviceCode);
    });
  }

  unregisterConnection(deviceCode: string) {
    if (this.connections.has(deviceCode)) {
      this.connections.delete(deviceCode);
      this.logger.log(`Device disconnected: ${deviceCode}`);
    }
  }

  sendCommand(deviceCode: string, payload: SSEMessage) {
    const res = this.connections.get(deviceCode);
    if (!res) {
      this.logger.warn(
        `Attempted to send command to disconnected device: ${deviceCode}`,
      );
      return false;
    }

    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    // @ts-ignore - flush headers if possible (standard node http response doesn't strictly need it for SSE if write is used, but good practice if behind proxy)
    if (typeof res.flush === 'function') {
      // @ts-ignore
      res.flush();
    }
    return true;
  }
}
