import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class ImportM3uDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
