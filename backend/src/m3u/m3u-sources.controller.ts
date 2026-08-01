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
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { M3uSourcesService } from './m3u-sources.service';
import { UpdateM3uSourceDto } from './dto/update-m3u-source.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('channels/sources')
export class M3uSourcesController {
  constructor(private readonly m3uSourcesService: M3uSourcesService) {}

  @Get()
  async findAll(@Request() req) {
    return this.m3uSourcesService.findAll(req.user);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateM3uSourceDto,
  ) {
    return this.m3uSourcesService.update(id, req.user, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Request() req, @Param('id') id: string) {
    return this.m3uSourcesService.remove(id, req.user);
  }

  @Post(':id/refresh')
  async refresh(@Request() req, @Param('id') id: string) {
    return this.m3uSourcesService.refresh(id, req.user);
  }
}
