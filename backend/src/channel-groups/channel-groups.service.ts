import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelGroup } from '../entities/channel-group.entity';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';
import { CreateChannelGroupDto } from './dto/create-channel-group.dto';

@Injectable()
export class ChannelGroupsService {
  constructor(
    @InjectRepository(ChannelGroup)
    private channelGroupRepository: Repository<ChannelGroup>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

  async findAll(user: User): Promise<ChannelGroup[]> {
    return this.channelGroupRepository.find({
      where: { userId: user.id },
      relations: ['channels'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, user: User): Promise<ChannelGroup> {
    const group = await this.channelGroupRepository.findOne({
      where: { id, userId: user.id },
      relations: ['channels'],
    });
    if (!group) {
      throw new NotFoundException('Channel group not found');
    }
    return group;
  }

  async create(user: User, dto: CreateChannelGroupDto): Promise<ChannelGroup> {
    const group = this.channelGroupRepository.create({
      name: dto.name,
      userId: user.id,
      channels: [],
    });
    return this.channelGroupRepository.save(group);
  }

  async remove(id: string, user: User): Promise<void> {
    const group = await this.channelGroupRepository.findOne({
      where: { id, userId: user.id },
    });
    if (!group) {
      throw new NotFoundException('Channel group not found');
    }
    await this.channelGroupRepository.remove(group);
  }

  async addChannel(groupId: string, channelId: string, user: User): Promise<ChannelGroup> {
    const group = await this.channelGroupRepository.findOne({
      where: { id: groupId, userId: user.id },
      relations: ['channels'],
    });
    if (!group) {
      throw new NotFoundException('Channel group not found');
    }

    const channel = await this.channelRepository.findOne({
      where: { id: channelId, userId: user.id },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const alreadyAdded = group.channels.some((c) => c.id === channelId);
    if (alreadyAdded) {
      throw new ConflictException('Channel already in group');
    }

    group.channels.push(channel);
    return this.channelGroupRepository.save(group);
  }

  async removeChannel(groupId: string, channelId: string, user: User): Promise<void> {
    const group = await this.channelGroupRepository.findOne({
      where: { id: groupId, userId: user.id },
      relations: ['channels'],
    });
    if (!group) {
      throw new NotFoundException('Channel group not found');
    }

    group.channels = group.channels.filter((c) => c.id !== channelId);
    await this.channelGroupRepository.save(group);
  }
}
