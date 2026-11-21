import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsIn, IsOptional, MaxLength, ValidateNested } from "class-validator";
import { OrderAddressDto } from "./order-address.dto";

export class CheckoutDto {
  @ApiProperty({ type: OrderAddressDto })
  @ValidateNested()
  @Type(() => OrderAddressDto)
  shippingAddress!: OrderAddressDto;

  @ApiProperty({
    required: false,
    description: "Defaults to shippingAddress when omitted.",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderAddressDto)
  billingAddress?: OrderAddressDto;

  @ApiProperty({ enum: ["standard", "express"] })
  @IsIn(["standard", "express"])
  deliveryMethod!: "standard" | "express";

  @ApiProperty({
    enum: ["mock_success", "mock_failure"],
    description:
      "Demo-mode payment outcome — see CLIENT_REQUIREMENTS.md (no real gateway yet).",
  })
  @IsIn(["mock_success", "mock_failure"])
  paymentMethod!: "mock_success" | "mock_failure";

  @ApiProperty({
    required: false,
    description:
      "Required for guest checkout (order emails go here). Ignored for signed-in customers.",
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiProperty({ required: false, enum: ["en", "fr", "ar"] })
  @IsOptional()
  @IsIn(["en", "fr", "ar"])
  locale?: "en" | "fr" | "ar";
}
