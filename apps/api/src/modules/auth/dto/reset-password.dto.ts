import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  token!: string;

  // Password policy mirrors RegisterDto — see CLAUDE.md "mirrors ... exactly"
  @ApiProperty()
  @IsString()
  @MinLength(10, { message: "Password must be at least 10 characters" })
  @Matches(/[A-Z]/, { message: "Password must contain an uppercase letter" })
  @Matches(/[a-z]/, { message: "Password must contain a lowercase letter" })
  @Matches(/[0-9]/, { message: "Password must contain a number" })
  password!: string;
}
