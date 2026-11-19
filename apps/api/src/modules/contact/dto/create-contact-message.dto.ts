import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

// Header-injection guard: single-line fields may never carry CR/LF.
const NO_LINE_BREAKS = /^[^\r\n]*$/;

// Mirrors packages/validation/src/contact.ts — see CLAUDE.md.
export class CreateContactMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(NO_LINE_BREAKS, { message: "must not contain line breaks" })
  name!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[+0-9 ()\-.]{6,25}$/, { message: "invalid phone number" })
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  @Matches(NO_LINE_BREAKS, { message: "must not contain line breaks" })
  subject!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;

  @ApiProperty({ enum: ["en", "fr", "ar"] })
  @IsIn(["en", "fr", "ar"])
  locale!: string;

  @ApiProperty({
    required: false,
    enum: ["order", "return", "product", "account", "pro", "other"],
  })
  @IsOptional()
  @IsIn(["order", "return", "product", "account", "pro", "other"])
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  orderReference?: string;

  /** Honeypot field: must stay empty. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
