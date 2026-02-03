import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';
import { lastValueFrom } from 'rxjs';
import { ImportM3uDto } from './dto/import-m3u.dto';

@Injectable()
export class M3uService {
  private readonly logger = new Logger(M3uService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    private dataSource: DataSource,
  ) {}

  async import(
    user: User,
    importM3uDto: ImportM3uDto,
  ): Promise<{ count: number }> {
    const { url } = importM3uDto;

    let content: string;
    try {
      this.logger.log(`Fetching M3U from ${url} for user ${user.id}`);
      const response = await lastValueFrom(this.httpService.get(url));
      content = response.data;
      this.logger.log(`Fetched ${content.length} bytes`);
    } catch (err) {
      this.logger.error(`Failed to fetch M3U: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to fetch M3U: ${err.message}`);
    }

    const channels = this.parseM3u(content, url, user.id);
    return this.saveChannels(user, channels);
  }

  async importFile(
    user: User,
    fileContent: string,
  ): Promise<{ count: number }> {
    const channels = this.parseM3u(fileContent, 'file-upload', user.id);
    return this.saveChannels(user, channels);
  }

  private async saveChannels(
    user: User,
    channels: Partial<Channel>[],
  ): Promise<{ count: number }> {
    this.logger.log(`Parsed ${channels.length} channels for user ${user.id}`);

    if (channels.length === 0) {
      return { count: 0 };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Only clear channels for this specific user
      this.logger.log(`Clearing existing channels for user ${user.id}...`);
      await queryRunner.manager.delete(Channel, { userId: user.id });

      // Batch save
      const chunkSize = 100;
      this.logger.log(
        `Saving ${channels.length} channels in batches of ${chunkSize}...`,
      );
      for (let i = 0; i < channels.length; i += chunkSize) {
        await queryRunner.manager.save(
          Channel,
          channels.slice(i, i + chunkSize),
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Imported ${channels.length} channels for user ${user.id}`);
      return { count: channels.length };
    } catch (err) {
      this.logger.error(`Failed to import channels: ${err.message}`, err.stack);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to import channels');
    } finally {
      await queryRunner.release();
    }
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
