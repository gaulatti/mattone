import { IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class UpdateM3uSourceDto {
  @IsOptional()
  @IsBoolean()
  autoRefresh?: boolean;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(43200)
  refreshIntervalMinutes?: number;
}
