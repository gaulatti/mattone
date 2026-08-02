import { Module, Global } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from '../entities/channel.entity';
import { ChannelReliabilityEvent } from '../entities/channel-reliability-event.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Channel, ChannelReliabilityEvent])],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
