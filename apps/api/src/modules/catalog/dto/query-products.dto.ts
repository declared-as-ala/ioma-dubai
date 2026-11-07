import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import type { ProductRangeKey } from "@ioma/config";

export class QueryProductsDto {
  @ApiPropertyOptional({
    enum: [
      "hydra",
      "energize",
      "renew",
      "calm",
      "purete",
      "matte",
      "illumine",
      "inlab",
      "coco",
      "hair",
    ],
  })
  @IsOptional()
  @IsIn([
    "hydra",
    "energize",
    "renew",
    "calm",
    "purete",
    "matte",
    "illumine",
    "inlab",
    "coco",
    "hair",
  ])
  range?: ProductRangeKey;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  concern?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bestSeller?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  skinType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;
}
