import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Post,
  Patch,
  Body,
  Param,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyReply } from 'fastify';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

const logoFallback = (name: string) => {
  const label = name.slice(0, 2).toUpperCase().replace(/[&<>"']/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="24" fill="#2c5784"/><text x="24" y="29" fill="#f9f6f2" font-family="Arial,sans-serif" font-size="16" font-weight="700" text-anchor="middle">${label}</text></svg>`;
};

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Request() req, @Body() dto: CreateChannelDto) {
    return this.channelsService.create(req.user, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateChannelDto) {
    return this.channelsService.update(id, req.user, dto);
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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
      ...(response.headers['accept-ranges'] ? { 'Accept-Ranges': response.headers['accept-ranges'] } : {}),
      ...(response.headers['content-range'] ? { 'Content-Range': response.headers['content-range'] } : {}),
      ...(response.headers['content-length'] ? { 'Content-Length': response.headers['content-length'] } : {}),
    });
    response.data.pipe(reply.raw);
  }

  @Get(':id/logo')
  async proxyLogo(@Param('id') id: string, @Res() reply: FastifyReply) {
    const { response, fallbackName } = await this.channelsService.getLogoStream(id);
    if (!response) {
      return reply
        .header('Cache-Control', 'public, max-age=3600')
        .header('Access-Control-Allow-Origin', '*')
        .type('image/svg+xml')
        .send(logoFallback(fallbackName ?? ''));
    }
    reply.hijack();
    reply.raw.writeHead(response.status, {
      'Content-Type': response.headers['content-type'] ?? 'image/*',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
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
