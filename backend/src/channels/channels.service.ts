import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';
import { ChannelResponseDto } from './dto/channel-response.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

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
}
