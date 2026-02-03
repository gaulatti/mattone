import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { M3uService } from './m3u.service';
import { ImportM3uDto } from './dto/import-m3u.dto';
import type { FastifyRequest } from 'fastify';

@UseGuards(AuthGuard('jwt'))
@Controller('channels')
export class M3uController {
  constructor(private readonly m3uService: M3uService) {}

  @Post('import')
  async import(@Body() importM3uDto: ImportM3uDto) {
    return this.m3uService.import(importM3uDto);
  }

  @Post('import/file')
  async uploadFile(@Req() request: FastifyRequest) {
    const data = await request.file();
    if (!data) {
      throw new BadRequestException('File is required');
    }
    const content = await data.toBuffer();
    return this.m3uService.importFile(content.toString('utf-8'));
  }
}
