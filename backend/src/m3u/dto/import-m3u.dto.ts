import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class ImportM3uDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  /** Keep re-fetching this playlist on a schedule. */
  @IsOptional()
  @IsBoolean()
  autoRefresh?: boolean;

  /** How often to re-fetch, in minutes (15 minutes to 30 days). */
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(43200)
  refreshIntervalMinutes?: number;
}
