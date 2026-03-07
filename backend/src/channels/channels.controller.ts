import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateChannelDto) {
    return this.channelsService.create(req.user, dto);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('group') group?: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.channelsService.findAll(req.user, group, search, page, limit);
  }

  @Get('groups')
  async getGroups(@Request() req) {
    return this.channelsService.getGroups(req.user);
  }
}
