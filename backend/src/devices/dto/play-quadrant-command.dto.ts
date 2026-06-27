import {
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class PlayQuadrantCommandDto {
  @IsUUID()
  @IsNotEmpty()
  channelId: string;

  @IsInt()
  @Min(0)
  @Max(3)
  @IsOptional()
  quadrant?: number;
}
