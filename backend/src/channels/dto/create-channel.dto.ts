import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tvgName: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  tvgLogo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  groupTitle?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  streamUrl: string;
}
