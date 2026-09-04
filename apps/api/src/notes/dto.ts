import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT, TITLE_MAX_LENGTH } from '@notes/shared';

export class CreateNoteDto {
  @IsString()
  @MinLength(1, { message: 'A title is required' })
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @IsString()
  text!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'A title is required' })
  @MaxLength(TITLE_MAX_LENGTH)
  title?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  tags?: string[];
}

export class ListNotesQuery {
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

  static clampLimit(limit: number | undefined): number {
    return Math.min(limit ?? DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
  }
}
