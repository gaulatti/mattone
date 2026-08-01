import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Channel } from '../entities/channel.entity';
import { M3uSource } from '../entities/m3u-source.entity';
import { User } from '../entities/user.entity';
import { lastValueFrom } from 'rxjs';
import { ImportM3uDto } from './dto/import-m3u.dto';

export interface ImportSummary {
  /** New channels inserted. Kept as `count` for backwards compatibility. */
  count: number;
  created: number;
  updated: number;
  unchanged: number;
  /** Distinct stream URLs found in the playlist. */
  total: number;
}

/** Metadata mirrored from the playlist onto an already-known stream URL. */
const METADATA_FIELDS = [
  'tvgName',
  'tvgLogo',
  'groupTitle',
  'sourceUrl',
] as const;

const FETCH_TIMEOUT_MS = 60_000;

@Injectable()
export class M3uService {
  private readonly logger = new Logger(M3uService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(M3uSource)
    private m3uSourceRepository: Repository<M3uSource>,
    private dataSource: DataSource,
  ) {}

  async import(user: User, importM3uDto: ImportM3uDto): Promise<ImportSummary> {
    const { url, autoRefresh, refreshIntervalMinutes } = importM3uDto;

    const source = await this.upsertSource(user.id, {
      url,
      autoRefresh,
      refreshIntervalMinutes,
    });

    return this.syncSource(source);
  }

  async importFile(user: User, fileContent: string): Promise<ImportSummary> {
    const channels = this.parseM3u(fileContent, 'file-upload', user.id);
    return this.syncChannels(user.id, channels);
  }

  /**
   * Re-fetches a registered playlist and mirrors its metadata onto the
   * user's channels. Sync outcome is recorded on the source itself so the
   * scheduler and the UI can report on it.
   */
  async syncSource(source: M3uSource): Promise<ImportSummary> {
    let content: string;
    try {
      content = await this.fetch(source.url, source.userId);
    } catch (err) {
      await this.m3uSourceRepository.update(source.id, {
        lastSyncedAt: new Date(),
        lastStatus: 'error',
        lastError: err.message?.slice(0, 500) ?? 'Unknown error',
      });
      throw new BadRequestException(`Failed to fetch M3U: ${err.message}`);
    }

    const channels = this.parseM3u(content, source.url, source.userId);
    const summary = await this.syncChannels(source.userId, channels);

    await this.m3uSourceRepository.update(source.id, {
      lastSyncedAt: new Date(),
      lastStatus: 'success',
      lastError: null,
      lastCreatedCount: summary.created,
      lastUpdatedCount: summary.updated,
      lastChannelCount: summary.total,
    });

    return summary;
  }

  /** Registers (or refreshes the schedule of) a playlist URL for a user. */
  async upsertSource(
    userId: string,
    options: {
      url: string;
      autoRefresh?: boolean;
      refreshIntervalMinutes?: number;
    },
  ): Promise<M3uSource> {
    const existing = await this.m3uSourceRepository.findOne({
      where: { userId, url: options.url },
    });

    if (existing) {
      if (options.autoRefresh !== undefined) {
        existing.autoRefresh = options.autoRefresh;
      }
      if (options.refreshIntervalMinutes !== undefined) {
        existing.refreshIntervalMinutes = options.refreshIntervalMinutes;
      }
      return this.m3uSourceRepository.save(existing);
    }

    return this.m3uSourceRepository.save(
      this.m3uSourceRepository.create({
        userId,
        url: options.url,
        autoRefresh: options.autoRefresh ?? true,
        refreshIntervalMinutes: options.refreshIntervalMinutes ?? 1440,
        lastStatus: 'pending',
      }),
    );
  }

  private async fetch(url: string, userId: string): Promise<string> {
    this.logger.log(`Fetching M3U from ${url} for user ${userId}`);
    const response = await lastValueFrom(
      this.httpService.get<string>(url, {
        responseType: 'text',
        transformResponse: (data: string) => data,
        timeout: FETCH_TIMEOUT_MS,
      }),
    );
    const content = response.data ?? '';
    this.logger.log(`Fetched ${content.length} bytes`);
    return content;
  }

  /**
   * Upserts the parsed playlist into the user's channels, keyed by stream URL:
   * unknown URLs are inserted, known ones have their metadata refreshed from
   * the playlist instead of being discarded.
   */
  private async syncChannels(
    userId: string,
    channels: Partial<Channel>[],
  ): Promise<ImportSummary> {
    this.logger.log(`Parsed ${channels.length} channels for user ${userId}`);

    const summary: ImportSummary = {
      count: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      total: 0,
    };

    if (channels.length === 0) {
      return summary;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Fetching all existing channels for user ${userId}...`);

      const existingChannels = await queryRunner.manager.find(Channel, {
        where: { userId },
        select: ['id', 'streamUrl', ...METADATA_FIELDS],
      });

      const existingByUrl = new Map(
        existingChannels.map((channel) => [channel.streamUrl, channel]),
      );
      const seenUrls = new Set<string>();

      const toInsert: Partial<Channel>[] = [];
      const toUpdate: {
        id: string;
        changes: QueryDeepPartialEntity<Channel>;
      }[] = [];

      // Deduplicate within the payload itself; upsert against the database
      for (const channel of channels) {
        if (!channel.streamUrl || seenUrls.has(channel.streamUrl)) continue;
        seenUrls.add(channel.streamUrl);

        const existing = existingByUrl.get(channel.streamUrl);
        if (!existing) {
          toInsert.push(channel);
          continue;
        }

        const changes = this.diffMetadata(existing, channel);
        if (Object.keys(changes).length > 0) {
          toUpdate.push({ id: existing.id, changes });
        } else {
          summary.unchanged++;
        }
      }

      this.logger.log(
        `Found ${toInsert.length} new and ${toUpdate.length} changed channels out of ${seenUrls.size} unique parsed.`,
      );

      const chunkSize = 100;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        await queryRunner.manager.insert(
          Channel,
          toInsert.slice(i, i + chunkSize),
        );
      }

      for (const { id, changes } of toUpdate) {
        await queryRunner.manager.update(Channel, id, changes);
      }

      await queryRunner.commitTransaction();

      summary.created = toInsert.length;
      summary.count = toInsert.length;
      summary.updated = toUpdate.length;
      summary.total = seenUrls.size;

      this.logger.log(
        `Imported ${summary.created} new and refreshed ${summary.updated} channels for user ${userId}`,
      );
      return summary;
    } catch (err) {
      this.logger.error(`Failed to import channels: ${err.message}`, err.stack);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to import channels');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * The playlist is the source of truth: any metadata field whose parsed value
   * differs from what is stored gets overwritten (missing tags become null).
   */
  private diffMetadata(
    existing: Channel,
    parsed: Partial<Channel>,
  ): QueryDeepPartialEntity<Channel> {
    const changes: QueryDeepPartialEntity<Channel> = {};

    for (const field of METADATA_FIELDS) {
      const next = this.normalize(parsed[field]);
      if (next !== this.normalize(existing[field])) {
        changes[field] = next as never;
      }
    }

    return changes;
  }

  private normalize(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private parseM3u(
    content: string,
    sourceUrl: string,
    userId: string,
  ): Partial<Channel>[] {
    const lines = content.split(/\r?\n/);
    const channels: Partial<Channel>[] = [];
    let currentChannel: Partial<Channel> | null = null;

    const tvgNameRegex = /tvg-name="([^"]*)"/;
    const tvgLogoRegex = /tvg-logo="([^"]*)"/;
    const groupTitleRegex = /group-title="([^"]*)"/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === '#EXTM3U') continue;

      if (trimmed.startsWith('#EXTINF:')) {
        currentChannel = { sourceUrl, userId };

        const nameMatch = trimmed.match(tvgNameRegex);
        if (nameMatch) currentChannel.tvgName = nameMatch[1];

        const logoMatch = trimmed.match(tvgLogoRegex);
        if (logoMatch) currentChannel.tvgLogo = logoMatch[1];

        const groupMatch = trimmed.match(groupTitleRegex);
        if (groupMatch) currentChannel.groupTitle = groupMatch[1];

        // Fallback for name if tvg-name is missing (name is usually after comma)
        if (!currentChannel.tvgName) {
          const parts = trimmed.split(',');
          if (parts.length > 1) {
            currentChannel.tvgName = parts[parts.length - 1].trim();
          }
        }
      } else if (!trimmed.startsWith('#')) {
        // Assume URL
        if (currentChannel) {
          currentChannel.streamUrl = trimmed;
          channels.push(currentChannel);
          currentChannel = null;
        }
      }
    }

    return channels;
  }
}
