import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { ChannelsModule } from './channels/channels.module';
import { ChannelGroupsModule } from './channel-groups/channel-groups.module';
import { M3uModule } from './m3u/m3u.module';
import { SseModule } from './sse/sse.module';
import { User } from './entities/user.entity';
import { Device } from './entities/device.entity';
import { Channel } from './entities/channel.entity';
import { ChannelGroup } from './entities/channel-group.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env', // Point to root .env
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME', 'mattone'),
        entities: [User, Device, Channel, ChannelGroup],
        synchronize: true, // Auto-migrate dev only
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    DevicesModule,
    ChannelsModule,
    ChannelGroupsModule,
    M3uModule,
    SseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
