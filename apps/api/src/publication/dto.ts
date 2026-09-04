import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { DEFAULT_PAGE_LIMIT } from '@notes/shared';

export class RejectNoteDto {
  @IsString()
  @MinLength(1, { message: 'A reason is required' })
  @MaxLength(500)
  reason!: string;
}

export class FeedQuery {
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
