import { BadGatewayException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import { Channel } from '../entities/channel.entity';
import { Device } from '../entities/device.entity';
import { User } from '../entities/user.entity';
import { SseService } from '../sse/sse.service';
import { ChannelResponseDto } from './dto/channel-response.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  private readonly playbackTickets = new Map<string, { channelId: string; userId: string; expiresAt: number }>();
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    private sseService: SseService,
  ) {}

  async create(user: User, dto: CreateChannelDto): Promise<ChannelResponseDto> {
    const channel = this.channelRepository.create({
      userId: user.id,
      tvgName: dto.tvgName.trim(),
      tvgLogo: dto.tvgLogo?.trim() || undefined,
      groupTitle: dto.groupTitle?.trim() || undefined,
      streamUrl: dto.streamUrl.trim(),
      sourceUrl: 'manual',
    });

    const saved = await this.channelRepository.save(channel);
    return new ChannelResponseDto(saved);
  }

  async update(id: string, user: User, dto: UpdateChannelDto): Promise<ChannelResponseDto> {
    const channel = await this.channelRepository.findOne({ where: { id, userId: user.id } });
    if (!channel) throw new NotFoundException('Channel not found');

    if (dto.tvgName !== undefined) channel.tvgName = dto.tvgName.trim();
    if (dto.streamUrl !== undefined) channel.streamUrl = dto.streamUrl.trim();
    if (dto.tvgLogo !== undefined) channel.tvgLogo = dto.tvgLogo.trim();
    if (dto.groupTitle !== undefined) channel.groupTitle = dto.groupTitle.trim();

    const saved = await this.channelRepository.save(channel);
    await this.syncActiveChannel(saved);
    return new ChannelResponseDto(saved);
  }

  /**
   * Keep active TV playback in sync after an owner changes a channel. The m3u
   * command refreshes the on-screen title/logo and picks up a changed stream URL.
   */
  private async syncActiveChannel(channel: Channel): Promise<void> {
    const devices = await this.deviceRepository.find({ where: { userId: channel.userId } });

    for (const device of devices) {
      if (device.layoutMode === 'single' && device.activeChannelId === channel.id) {
        this.sseService.sendCommand(device.deviceCode, {
          type: 'm3u',
          url: channel.streamUrl,
          title: channel.tvgName,
          logo: channel.tvgLogo,
          layoutMode: 'single',
        });
        continue;
      }

      if (device.layoutMode !== 'quad') continue;
      const activeQuadrants = device.activeQuadrants.filter((active) => active.channelId === channel.id);
      if (activeQuadrants.length === 0) continue;

      device.activeQuadrants = device.activeQuadrants.map((active) =>
        active.channelId === channel.id
          ? { ...active, channelName: channel.tvgName, channelLogo: channel.tvgLogo }
          : active,
      );
      await this.deviceRepository.save(device);

      for (const active of activeQuadrants) {
        this.sseService.sendCommand(device.deviceCode, {
          type: 'm3u',
          url: channel.streamUrl,
          title: channel.tvgName,
          logo: channel.tvgLogo,
          layoutMode: 'quad',
          quadrant: active.quadrant,
        });
      }
    }

    this.logger.log(`Synced updated channel ${channel.id} to active devices`);
  }

  async findAll(
    user: User,
    group?: string,
    search?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ChannelResponseDto[]; total: number }> {
    const query = this.channelRepository.createQueryBuilder('channel');

    // Filter by user
    query.andWhere('channel.userId = :userId', { userId: user.id });

    if (group) {
      query.andWhere('channel.groupTitle = :group', { group });
    }

    if (search) {
      query.andWhere('LOWER(channel.tvgName) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    query.orderBy('channel.tvgName', 'ASC');

    // Pagination
    query.skip((page - 1) * limit);
    query.take(limit);

    const [channels, total] = await query.getManyAndCount();
    // Mask sensitive fields
    const data = channels.map((channel) => new ChannelResponseDto(channel));
    return { data, total };
  }

  async getGroups(user: User): Promise<string[]> {
    const result = await this.channelRepository
      .createQueryBuilder('channel')
      .select('DISTINCT(channel.groupTitle)', 'group_title')
      .where('channel.userId = :userId', { userId: user.id })
      .orderBy('group_title', 'ASC')
      .getRawMany();

    return result.map((r) => r.group_title).filter((g) => g);
  }

  async getPlaybackSource(user: User, id: string): Promise<{ streamUrl: string; format: 'hls' | 'ts' | 'unknown' }> {
    const channel = await this.channelRepository.findOne({ where: { id, userId: user.id } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    this.removeExpiredPlaybackTickets();
    const ticket = randomUUID();
    this.playbackTickets.set(ticket, {
      channelId: channel.id,
      userId: user.id,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });
    return {
      streamUrl: `/channels/playback/${ticket}`,
      format: this.getPlaybackFormat(channel.streamUrl),
    };
  }

  async getPlaybackStream(ticket: string, target?: string) {
    const playbackTicket = this.playbackTickets.get(ticket);
    if (!playbackTicket || playbackTicket.expiresAt < Date.now()) {
      this.playbackTickets.delete(ticket);
      throw new NotFoundException('Playback session expired');
    }

    const channel = await this.channelRepository.findOne({
      where: { id: playbackTicket.channelId, userId: playbackTicket.userId },
    });
    if (!channel) throw new NotFoundException('Channel not found');

    const source = this.validateRemoteUrl(target ?? channel.streamUrl);
    try {
      const response = await lastValueFrom(
        this.httpService.get(source, {
          responseType: 'stream',
          timeout: 15_000,
          maxRedirects: 3,
          headers: { Range: 'bytes=0-' },
        }),
      );
      return { source, response };
    } catch {
      throw new BadGatewayException('Unable to reach stream source');
    }
  }

  async getLogoStream(id: string) {
    const channel = await this.channelRepository.findOne({ where: { id } });
    if (!channel?.tvgLogo) throw new NotFoundException('Channel logo not found');

    try {
      const response = await lastValueFrom(
        this.httpService.get(this.validateRemoteUrl(channel.tvgLogo), {
          responseType: 'stream',
          timeout: 10_000,
          maxRedirects: 3,
        }),
      );
      return { response, fallbackName: null };
    } catch {
      return { response: null, fallbackName: channel.tvgName };
    }
  }

  isPlaylist(source: string, contentType?: string): boolean {
    return source.toLowerCase().includes('.m3u8') || Boolean(contentType?.includes('mpegurl'));
  }

  private getPlaybackFormat(source: string): 'hls' | 'ts' | 'unknown' {
    const path = source.split(/[?#]/)[0].toLowerCase();
    if (path.endsWith('.m3u8')) return 'hls';
    if (path.endsWith('.ts')) return 'ts';
    return 'unknown';
  }

  rewritePlaylist(manifest: string, source: string, ticket: string): string {
    const proxied = (value: string) => `/channels/playback/${ticket}?url=${encodeURIComponent(new URL(value, source).toString())}`;
    return manifest
      .split(/\r?\n/)
      .map((line) => {
        if (!line) return line;
        if (!line.startsWith('#')) return proxied(line);
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => `URI="${proxied(uri)}"`);
      })
      .join('\n');
  }

  private validateRemoteUrl(value: string): string {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new BadGatewayException('Invalid remote URL');
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new BadGatewayException('Unsupported remote URL');
    }
    return url.toString();
  }

  private removeExpiredPlaybackTickets(): void {
    for (const [ticket, value] of this.playbackTickets) {
      if (value.expiresAt < Date.now()) this.playbackTickets.delete(ticket);
    }
  }
}
