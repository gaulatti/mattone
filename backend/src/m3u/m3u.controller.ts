import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { M3uService } from './m3u.service';
import { ImportM3uDto } from './dto/import-m3u.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('channels')
export class M3uController {
  constructor(private readonly m3uService: M3uService) {}

  @Post('import')
  async import(@Body() importM3uDto: ImportM3uDto) {
    return this.m3uService.import(importM3uDto);
  }
}
