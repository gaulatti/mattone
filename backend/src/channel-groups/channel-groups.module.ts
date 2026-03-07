import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelGroupsController } from './channel-groups.controller';
import { ChannelGroupsService } from './channel-groups.service';
import { ChannelGroup } from '../entities/channel-group.entity';
import { Channel } from '../entities/channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChannelGroup, Channel])],
  controllers: [ChannelGroupsController],
  providers: [ChannelGroupsService],
})
export class ChannelGroupsModule {}
