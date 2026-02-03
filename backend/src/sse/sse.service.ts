import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface SSEMessage {
  type: string;
  [key: string]: any;
}

interface DeviceMessage {
  deviceCode: string;
  payload: SSEMessage;
}

@Injectable()
export class SseService implements OnModuleDestroy {
  private readonly logger = new Logger(SseService.name);
  private readonly messageSubject = new Subject<DeviceMessage>();
  private readonly disconnectSubject = new Subject<string>();
  private readonly activeConnections = new Set<string>();
  public readonly connectionSubject = new Subject<string>();

  onModuleDestroy() {
    this.messageSubject.complete();
    this.disconnectSubject.complete();
    this.connectionSubject.complete();
  }

  getMessageStream(deviceCode: string): Observable<any> {
    // Register the connection
    if (this.activeConnections.has(deviceCode)) {
      this.logger.warn(
        `Device ${deviceCode} reconnecting, closing previous connection`,
      );
      this.disconnectSubject.next(deviceCode);
    }

    this.activeConnections.add(deviceCode);
    this.logger.log(`Device connected: ${deviceCode}`);
    this.connectionSubject.next(deviceCode);

    // Return filtered message stream for this device
    return this.messageSubject.pipe(
      filter((msg) => msg.deviceCode === deviceCode),
      map((msg) => ({ data: msg.payload })),
    );
  }

  getDisconnectStream(deviceCode: string): Observable<void> {
    return this.disconnectSubject.pipe(
      filter((code) => code === deviceCode),
      map(() => {
        this.activeConnections.delete(deviceCode);
        this.logger.log(`Device disconnected: ${deviceCode}`);
        return undefined;
      }),
    );
  }

  sendCommand(deviceCode: string, payload: SSEMessage): boolean {
    if (!this.activeConnections.has(deviceCode)) {
      this.logger.warn(
        `Attempted to send command to disconnected device: ${deviceCode}`,
      );
      return false;
    }

    this.messageSubject.next({ deviceCode, payload });
    return true;
  }

  disconnectDevice(deviceCode: string): void {
    if (this.activeConnections.has(deviceCode)) {
      this.disconnectSubject.next(deviceCode);
    }
  }
}
