import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tvgName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  tvgLogo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  groupTitle?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  streamUrl?: string;
}
