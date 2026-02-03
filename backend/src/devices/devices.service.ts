import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';
import { SseService } from '../sse/sse.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { PlayCommandDto } from './dto/play-command.dto';

@Injectable()
export class DevicesService implements OnModuleInit {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    private sseService: SseService,
  ) {}

  onModuleInit() {
    this.sseService.connectionSubject.subscribe(async (deviceCode) => {
      await this.syncDeviceState(deviceCode);
    });
  }

  private async syncDeviceState(deviceCode: string) {
    try {
      const device = await this.deviceRepository.findOne({
        where: { deviceCode },
      });

      if (device && device.activeChannelId) {
        this.logger.log(
          `Syncing state for device ${deviceCode} with channel ${device.activeChannelId}`,
        );
        // Ensure the channel belongs to the device's user
        const channel = await this.channelRepository.findOneBy({
          id: device.activeChannelId,
          userId: device.userId,
        });
        if (channel) {
          const payload = {
            type: 'm3u',
            url: channel.streamUrl,
            title: channel.tvgName,
            logo: channel.tvgLogo,
          };
          this.sseService.sendCommand(deviceCode, payload);
        }
      }
    } catch (err) {
      this.logger.error(
        `Failed to sync device state for ${deviceCode}`,
        err.stack,
      );
    }
  }

  async whoAmI(deviceCode: string): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { deviceCode },
    });
    if (!device) {
      throw new NotFoundException();
    }
  }

  async register(
    user: User,
    createDeviceDto: CreateDeviceDto,
  ): Promise<Device> {
    const existing = await this.deviceRepository.findOne({
      where: { deviceCode: createDeviceDto.deviceCode },
      relations: ['user'],
    });

    if (existing) {
      if (existing.userId === user.id) {
        return existing;
      }
      throw new ConflictException(
        'Device is already registered to another user',
      );
    }

    const device = this.deviceRepository.create({
      deviceCode: createDeviceDto.deviceCode,
      user,
    });

    return this.deviceRepository.save(device);
  }

  async findAll(user: User): Promise<Device[]> {
    return this.deviceRepository.find({ where: { userId: user.id } }); // Assuming userId usage
  }

  async remove(id: string, user: User): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { id, userId: user.id },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.deviceRepository.remove(device);
    this.sseService.disconnectDevice(device.deviceCode);
  }

  async play(id: string, user: User, command: PlayCommandDto) {
    const device = await this.deviceRepository.findOne({
      where: { id, userId: user.id },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Ensure the channel belongs to this user
    const channel = await this.channelRepository.findOneBy({
      id: command.channelId,
      userId: user.id,
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const payload = {
      type: 'm3u',
      url: channel.streamUrl,
      title: channel.tvgName,
      logo: channel.tvgLogo,
    };

    // Updates active channel even if offline
    device.activeChannelId = channel.id;
    await this.deviceRepository.save(device);

    const sent = this.sseService.sendCommand(device.deviceCode, payload);
    return { status: sent ? 'command sent' : 'queued' };
  }

  async stop(id: string, user: User) {
    const device = await this.deviceRepository.findOne({
      where: { id, userId: user.id },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Clear active channel
    device.activeChannelId = null;
    await this.deviceRepository.save(device);

    const sent = this.sseService.sendCommand(device.deviceCode, {
      type: 'stop',
    });
    return { status: sent ? 'command sent' : 'queued' };
  }
}
