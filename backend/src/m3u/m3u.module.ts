import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { M3uController } from './m3u.controller';
import { M3uService } from './m3u.service';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, User]), HttpModule],
  controllers: [M3uController],
  providers: [M3uService],
})
export class M3uModule {}
