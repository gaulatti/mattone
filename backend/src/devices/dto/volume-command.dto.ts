import { IsInt, Max, Min } from 'class-validator';

export class VolumeCommandDto {
  @IsInt()
  @Min(-100)
  @Max(100)
  delta: number;
}
