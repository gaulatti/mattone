import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class UpdateDeviceDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nickname?: string;

  @IsIn(['single', 'quad'])
  @IsOptional()
  layoutMode?: 'single' | 'quad';
}
