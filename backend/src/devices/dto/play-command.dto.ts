import { IsNotEmpty, IsUUID } from 'class-validator';

export class PlayCommandDto {
  @IsUUID()
  @IsNotEmpty()
  channelId: string;
}
