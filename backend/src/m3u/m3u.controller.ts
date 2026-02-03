import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { M3uService } from './m3u.service';
import { ImportM3uDto } from './dto/import-m3u.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('channels')
export class M3uController {
  constructor(private readonly m3uService: M3uService) {}

  @Post('import')
  async import(@Request() req, @Body() importM3uDto: ImportM3uDto) {
    return this.m3uService.import(req.user, importM3uDto);
  }

  @Post('import/file')
  async importFile(@Request() req: any) {
    const file = await req.file();
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const chunks: Buffer[] = [];
    for await (const chunk of file.file) {
      chunks.push(Buffer.from(chunk));
    }
    const content = Buffer.concat(chunks).toString('utf-8');

    return this.m3uService.importFile(req.user as any, content);
  }
}
