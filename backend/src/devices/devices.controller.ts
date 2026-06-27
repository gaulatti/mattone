import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { PlayCommandDto } from './dto/play-command.dto';
import { PlayQuadrantCommandDto } from './dto/play-quadrant-command.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('whoami')
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
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(id, req.user, updateDeviceDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(204)
  async remove(@Request() req, @Param('id') id: string) {
    return this.devicesService.remove(id, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/quad/enable')
  async enableQuadMode(@Request() req, @Param('id') id: string) {
    return this.devicesService.enableQuadMode(id, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/quad/disable')
  async disableQuadMode(@Request() req, @Param('id') id: string) {
    return this.devicesService.disableQuadMode(id, req.user);
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
  @Post(':id/quad/play')
  async playQuadrant(
    @Request() req,
    @Param('id') id: string,
    @Body() command: PlayQuadrantCommandDto,
  ) {
    return this.devicesService.playQuadrant(id, req.user, command);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/stop')
  async stop(@Request() req, @Param('id') id: string) {
    return this.devicesService.stop(id, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/quad/stop/:quadrant')
  async stopQuadrant(
    @Request() req,
    @Param('id') id: string,
    @Param('quadrant', ParseIntPipe) quadrant: number,
  ) {
    return this.devicesService.stopQuadrant(id, req.user, quadrant);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/callsign')
  async callsign(@Request() req, @Param('id') id: string) {
    return this.devicesService.callsign(id, req.user);
  }
}
