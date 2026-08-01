import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { M3uSource } from '../entities/m3u-source.entity';
import { User } from '../entities/user.entity';
import { M3uService, ImportSummary } from './m3u.service';
import { UpdateM3uSourceDto } from './dto/update-m3u-source.dto';

@Injectable()
export class M3uSourcesService {
  private readonly logger = new Logger(M3uSourcesService.name);

  constructor(
    @InjectRepository(M3uSource)
    private m3uSourceRepository: Repository<M3uSource>,
    private readonly m3uService: M3uService,
  ) {}

  async findAll(user: User): Promise<M3uSource[]> {
    return this.m3uSourceRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    user: User,
    dto: UpdateM3uSourceDto,
  ): Promise<M3uSource> {
    const source = await this.findOne(id, user);

    if (dto.autoRefresh !== undefined) source.autoRefresh = dto.autoRefresh;
    if (dto.refreshIntervalMinutes !== undefined) {
      source.refreshIntervalMinutes = dto.refreshIntervalMinutes;
    }

    return this.m3uSourceRepository.save(source);
  }

  async remove(id: string, user: User): Promise<void> {
    const source = await this.findOne(id, user);
    await this.m3uSourceRepository.remove(source);
  }

  /** Re-fetches a playlist on demand, outside of the schedule. */
  async refresh(id: string, user: User): Promise<ImportSummary> {
    const source = await this.findOne(id, user);
    return this.m3uService.syncSource(source);
  }

  /**
   * Re-fetches every playlist whose refresh interval has elapsed. Sources are
   * processed one at a time so a large playlist cannot starve the pool, and a
   * failing source never blocks the rest.
   */
  async syncDueSources(now: Date = new Date()): Promise<void> {
    const due = await this.findDue(now);

    if (due.length === 0) return;

    this.logger.log(`Refreshing ${due.length} due M3U source(s)`);

    for (const source of due) {
      try {
        const summary = await this.m3uService.syncSource(source);
        this.logger.log(
          `Refreshed ${source.url}: ${summary.created} new, ${summary.updated} updated`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to refresh ${source.url}: ${err.message}`,
          err.stack,
        );
      }
    }
  }

  private async findDue(now: Date): Promise<M3uSource[]> {
    return this.m3uSourceRepository
      .createQueryBuilder('source')
      .where('source.autoRefresh = true')
      .andWhere(
        `(source.lastSyncedAt IS NULL OR source.lastSyncedAt <= CAST(:now AS timestamptz) - (source.refreshIntervalMinutes * INTERVAL '1 minute'))`,
        { now },
      )
      .orderBy('source.lastSyncedAt', 'ASC', 'NULLS FIRST')
      .getMany();
  }

  private async findOne(id: string, user: User): Promise<M3uSource> {
    const source = await this.m3uSourceRepository.findOne({
      where: { id, userId: user.id },
    });
    if (!source) {
      throw new NotFoundException('M3U source not found');
    }
    return source;
  }
}
