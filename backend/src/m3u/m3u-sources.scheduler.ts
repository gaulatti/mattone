import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { M3uSourcesService } from './m3u-sources.service';

/**
 * Wakes up every 10 minutes and re-fetches the playlists whose own refresh
 * interval has elapsed. Runs are skipped while a previous one is still going,
 * so a slow batch cannot pile up on itself.
 */
@Injectable()
export class M3uSourcesScheduler {
  private readonly logger = new Logger(M3uSourcesScheduler.name);
  private running = false;

  constructor(private readonly m3uSourcesService: M3uSourcesService) {}

  @Cron(CronExpression.EVERY_10_MINUTES, { name: 'm3u-source-refresh' })
  async refreshDueSources(): Promise<void> {
    if (this.running) {
      this.logger.warn(
        'Previous M3U refresh still running, skipping this tick',
      );
      return;
    }

    this.running = true;
    try {
      await this.m3uSourcesService.syncDueSources();
    } catch (err) {
      this.logger.error(`M3U refresh cycle failed: ${err.message}`, err.stack);
    } finally {
      this.running = false;
    }
  }
}
