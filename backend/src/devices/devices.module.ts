import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { Device } from '../entities/device.entity';
import { Channel } from '../entities/channel.entity';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Channel]), SseModule],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
