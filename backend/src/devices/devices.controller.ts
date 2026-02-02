import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { PlayCommandDto } from './dto/play-command.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('whoami')
  @HttpCode(204)
  async whoAmI(@Headers('X-Device-ID') deviceId: string) {
    return this.devicesService.whoAmI(deviceId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async register(@Request() req, @Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.register(req.user, createDeviceDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req) {
    return this.devicesService.findAll(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(204)
  async remove(@Request() req, @Param('id') id: string) {
    return this.devicesService.remove(id, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/play')
  async play(
    @Request() req,
    @Param('id') id: string,
    @Body() command: PlayCommandDto,
  ) {
    return this.devicesService.play(id, req.user, command);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/stop')
  async stop(@Request() req, @Param('id') id: string) {
    return this.devicesService.stop(id, req.user);
  }
}
