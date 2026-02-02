import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('import/file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const content = file.buffer.toString('utf-8');
    return this.m3uService.importFile(content);
  }
}
