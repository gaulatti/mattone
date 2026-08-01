import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';
import { Device } from '../entities/device.entity';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, User, Device]), HttpModule, SseModule],
  controllers: [ChannelsController],
  providers: [ChannelsService],
})
export class ChannelsModule {}
