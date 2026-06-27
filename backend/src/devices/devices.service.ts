import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';
import { SseService } from '../sse/sse.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { PlayCommandDto } from './dto/play-command.dto';
import { PlayQuadrantCommandDto } from './dto/play-quadrant-command.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

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

      if (!device) {
        return;
      }

      if (device.layoutMode === 'quad' && device.activeQuadrants?.length > 0) {
        this.logger.log(
          `Syncing quad state for device ${deviceCode} with ${device.activeQuadrants.length} quadrants`,
        );

        for (const active of device.activeQuadrants) {
          const channel = await this.channelRepository.findOneBy({
            id: active.channelId,
            userId: device.userId,
          });
          if (channel) {
            const payload = {
              type: 'm3u',
              url: channel.streamUrl,
              title: channel.tvgName,
              logo: channel.tvgLogo,
              layoutMode: 'quad',
              quadrant: active.quadrant,
            };
            this.sseService.sendCommand(deviceCode, payload);
          }
        }
        return;
      }

      if (device.activeChannelId) {
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
            layoutMode: 'single',
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

  async whoAmI(deviceCode: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { deviceCode },
    });
    if (!device) {
      throw new NotFoundException();
    }
    return device;
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

  async update(
    id: string,
    user: User,
    updateDeviceDto: UpdateDeviceDto,
  ): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { id, userId: user.id },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (updateDeviceDto.nickname !== undefined) {
      device.nickname = updateDeviceDto.nickname?.trim() || null;
    }

    if (updateDeviceDto.layoutMode !== undefined) {
      device.layoutMode = updateDeviceDto.layoutMode;
    }

    return this.deviceRepository.save(device);
  }

  async remove(id: string, user: User): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { id, userId: user.id },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    this.sseService.sendCommand(device.deviceCode, { type: 'stop' });
    this.sseService.disconnectDevice(device.deviceCode);
    await this.deviceRepository.remove(device);
  }

  private async getOwnedDevice(id: string, user: User): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { id, userId: user.id },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return device;
  }

  async enableQuadMode(id: string, user: User) {
    const device = await this.getOwnedDevice(id, user);

    device.layoutMode = 'quad';
    device.activeChannelId = null;
    await this.deviceRepository.save(device);

    const sent = this.sseService.sendCommand(device.deviceCode, {
      type: 'stop',
    });
    return { status: sent ? 'command sent' : 'queued' };
  }

  async disableQuadMode(id: string, user: User) {
    const device = await this.getOwnedDevice(id, user);

    device.layoutMode = 'single';
    device.activeQuadrants = [];
    await this.deviceRepository.save(device);

    const sent = this.sseService.sendCommand(device.deviceCode, {
      type: 'stop',
    });
    return { status: sent ? 'command sent' : 'queued' };
  }

  async play(id: string, user: User, command: PlayCommandDto) {
    const device = await this.getOwnedDevice(id, user);

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
      layoutMode: 'single' as const,
    };

    // Switching to single mode clears any quad state
    device.layoutMode = 'single';
    device.activeQuadrants = [];
    device.activeChannelId = channel.id;
    await this.deviceRepository.save(device);

    const sent = this.sseService.sendCommand(device.deviceCode, payload);
    return { status: sent ? 'command sent' : 'queued' };
  }

  async playQuadrant(id: string, user: User, command: PlayQuadrantCommandDto) {
    const device = await this.getOwnedDevice(id, user);

    if (device.layoutMode !== 'quad') {
      throw new BadRequestException(
        'Device is not in quad mode. Enable quad mode first.',
      );
    }

    const channel = await this.channelRepository.findOneBy({
      id: command.channelId,
      userId: user.id,
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    let quadrant = command.quadrant;
    if (quadrant === undefined) {
      // Auto-assign first empty quadrant
      const used = new Set(device.activeQuadrants.map((q) => q.quadrant));
      quadrant = [0, 1, 2, 3].find((q) => !used.has(q));
      if (quadrant === undefined) {
        throw new BadRequestException(
          'All quadrants are occupied. Stop one first or specify a quadrant to replace.',
        );
      }
    }

    // Replace any existing channel in the target quadrant
    device.activeQuadrants = [
      ...device.activeQuadrants.filter((q) => q.quadrant !== quadrant),
      { quadrant, channelId: channel.id },
    ];
    await this.deviceRepository.save(device);

    const payload = {
      type: 'm3u',
      url: channel.streamUrl,
      title: channel.tvgName,
      logo: channel.tvgLogo,
      layoutMode: 'quad' as const,
      quadrant,
    };

    const sent = this.sseService.sendCommand(device.deviceCode, payload);
    return { status: sent ? 'command sent' : 'queued', quadrant };
  }

  async stopQuadrant(id: string, user: User, quadrant: number) {
    if (quadrant < 0 || quadrant > 3) {
      throw new BadRequestException('Quadrant must be between 0 and 3');
    }

    const device = await this.getOwnedDevice(id, user);

    device.activeQuadrants = device.activeQuadrants.filter(
      (q) => q.quadrant !== quadrant,
    );
    await this.deviceRepository.save(device);

    const sent = this.sseService.sendCommand(device.deviceCode, {
      type: 'stop',
      quadrant,
    });
    return { status: sent ? 'command sent' : 'queued' };
  }

  async stop(id: string, user: User) {
    const device = await this.getOwnedDevice(id, user);

    // Clear active channel and all quadrants, reset to single mode
    device.activeChannelId = null;
    device.activeQuadrants = [];
    device.layoutMode = 'single';
    await this.deviceRepository.save(device);

    const sent = this.sseService.sendCommand(device.deviceCode, {
      type: 'stop',
    });
    return { status: sent ? 'command sent' : 'queued' };
  }

  async callsign(id: string, user: User) {
    const device = await this.getOwnedDevice(id, user);

    const payload = {
      type: 'callsign',
      deviceCode: device.deviceCode,
      nickname: device.nickname,
    };

    const sent = this.sseService.sendCommand(device.deviceCode, payload);
    return { status: sent ? 'command sent' : 'queued' };
  }
}
