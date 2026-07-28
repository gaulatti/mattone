import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Post,
  Body,
  Param,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyReply } from 'fastify';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Request() req, @Body() dto: CreateChannelDto) {
    return this.channelsService.create(req.user, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  async getGroups(@Request() req) {
    return this.channelsService.getGroups(req.user);
  }

  @Get('playback/:ticket')
  async proxyPlayback(
    @Param('ticket') ticket: string,
    @Query('url') target: string | undefined,
    @Res() reply: FastifyReply,
  ) {
    const { source, response } = await this.channelsService.getPlaybackStream(ticket, target);
    const contentType = response.headers['content-type'];
    if (this.channelsService.isPlaylist(source, contentType)) {
      let manifest = '';
      for await (const chunk of response.data) manifest += chunk.toString();
      return reply
        .header('Cache-Control', 'no-store')
        .type('application/vnd.apple.mpegurl')
        .send(this.channelsService.rewritePlaylist(manifest, source, ticket));
    }

    reply.hijack();
    reply.raw.writeHead(response.status, {
      'Content-Type': contentType ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
      ...(response.headers['content-length'] ? { 'Content-Length': response.headers['content-length'] } : {}),
    });
    response.data.pipe(reply.raw);
  }

  @Get(':id/logo')
  async proxyLogo(@Param('id') id: string, @Res() reply: FastifyReply) {
    const response = await this.channelsService.getLogoStream(id);
    reply.hijack();
    reply.raw.writeHead(response.status, {
      'Content-Type': response.headers['content-type'] ?? 'image/*',
      'Cache-Control': 'public, max-age=86400',
      ...(response.headers['content-length'] ? { 'Content-Length': response.headers['content-length'] } : {}),
    });
    response.data.pipe(reply.raw);
  }

  @Get(':id/playback')
  @UseGuards(AuthGuard('jwt'))
  async getPlaybackSource(@Request() req, @Param('id') id: string) {
    return this.channelsService.getPlaybackSource(req.user, id);
  }
}
