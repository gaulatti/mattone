import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { M3uController } from './m3u.controller';
import { M3uSourcesController } from './m3u-sources.controller';
import { M3uService } from './m3u.service';
import { M3uSourcesService } from './m3u-sources.service';
import { M3uSourcesScheduler } from './m3u-sources.scheduler';
import { Channel } from '../entities/channel.entity';
import { M3uSource } from '../entities/m3u-source.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, M3uSource, User]), HttpModule],
  controllers: [M3uController, M3uSourcesController],
  providers: [M3uService, M3uSourcesService, M3uSourcesScheduler],
})
export class M3uModule {}
