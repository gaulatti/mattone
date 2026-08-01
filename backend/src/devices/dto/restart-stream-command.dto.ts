import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RestartStreamCommandDto {
  @IsInt()
  @Min(0)
  @Max(3)
  @IsOptional()
  quadrant?: number;
}
