import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateChannelGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
