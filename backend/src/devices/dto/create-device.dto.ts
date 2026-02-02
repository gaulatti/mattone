import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceCode: string;
}
