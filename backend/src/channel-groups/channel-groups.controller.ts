import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChannelGroupsService } from './channel-groups.service';
import { CreateChannelGroupDto } from './dto/create-channel-group.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('channel-groups')
export class ChannelGroupsController {
  constructor(private readonly channelGroupsService: ChannelGroupsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.channelGroupsService.findAll(req.user);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.channelGroupsService.findOne(id, req.user);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateChannelGroupDto) {
    return this.channelGroupsService.create(req.user, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Request() req, @Param('id') id: string) {
    return this.channelGroupsService.remove(id, req.user);
  }

  @Post(':id/channels/:channelId')
  async addChannel(
    @Request() req,
    @Param('id') id: string,
    @Param('channelId') channelId: string,
  ) {
    return this.channelGroupsService.addChannel(id, channelId, req.user);
  }

  @Delete(':id/channels/:channelId')
  @HttpCode(204)
  async removeChannel(
    @Request() req,
    @Param('id') id: string,
    @Param('channelId') channelId: string,
  ) {
    return this.channelGroupsService.removeChannel(id, channelId, req.user);
  }
}
