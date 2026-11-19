import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^$|^[+0-9 ()\-.]{6,20}$/, { message: "invalid phone number" })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skinConcerns?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  newsletterOptIn?: boolean;

  @ApiPropertyOptional({ enum: ["en", "fr", "ar"] })
  @IsOptional()
  @IsIn(["en", "fr", "ar"])
  preferredLocale?: string;
}
