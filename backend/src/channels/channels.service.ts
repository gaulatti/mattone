import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

  async findAll(
    group?: string,
    search?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Channel[]; total: number }> {
    const query = this.channelRepository.createQueryBuilder('channel');

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

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async getGroups(): Promise<string[]> {
    const result = await this.channelRepository
      .createQueryBuilder('channel')
      .select('DISTINCT(channel.groupTitle)', 'group_title')
      .orderBy('group_title', 'ASC')
      .getRawMany();

    return result.map((r) => r.group_title).filter((g) => g);
  }
}
