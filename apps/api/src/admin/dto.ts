import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { DEFAULT_PAGE_LIMIT } from '@notes/shared';

export class AdminListQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = DEFAULT_PAGE_LIMIT;

  @IsOptional()
  @IsString()
  tag?: string;
}
