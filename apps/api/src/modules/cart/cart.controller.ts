import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { OptionalUser } from "../auth/decorators/optional-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { CartService, type CartOwner } from "./cart.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { RequireProfessional } from "../../common/guards/auth.decorators";
import { ProfessionalApprovedGuard } from "../../common/guards/professional-approved.guard";

function resolveOwner(
  user: JwtPayload | undefined,
  guestSessionId: string | undefined,
): CartOwner {
  return user ? { userId: user.sub } : { sessionId: guestSessionId };
}

@ApiTags("cart")
@ApiHeader({
  name: "X-Guest-Session-Id",
  required: false,
  description:
    "Client-generated UUID identifying a guest cart. Not required when authenticated.",
})
@Controller("cart")
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(
    @OptionalUser() user: JwtPayload | undefined,
    @Headers("x-guest-session-id") guestSessionId?: string,
  ) {
    return this.cartService.getCart(resolveOwner(user, guestSessionId));
  }

  @Post("items")
  addItem(
    @OptionalUser() user: JwtPayload | undefined,
    @Headers("x-guest-session-id") guestSessionId: string | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(resolveOwner(user, guestSessionId), dto);
  }

  @Patch("items/:sku")
  updateItem(
    @OptionalUser() user: JwtPayload | undefined,
    @Headers("x-guest-session-id") guestSessionId: string | undefined,
    @Param("sku") sku: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(resolveOwner(user, guestSessionId), sku, dto);
  }

  @Delete("items/:sku")
  removeItem(
    @OptionalUser() user: JwtPayload | undefined,
    @Headers("x-guest-session-id") guestSessionId: string | undefined,
    @Param("sku") sku: string,
  ) {
    return this.cartService.removeItem(resolveOwner(user, guestSessionId), sku);
  }

  @Get("pro")
  @UseGuards(JwtAuthGuard, ProfessionalApprovedGuard)
  @RequireProfessional()
  getProCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.getCart({ userId: user.sub, type: "b2b" });
  }

  @Patch("pro/items/:sku")
  @UseGuards(JwtAuthGuard, ProfessionalApprovedGuard)
  @RequireProfessional()
  updateProItem(
    @CurrentUser() user: JwtPayload,
    @Param("sku") sku: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem({ userId: user.sub, type: "b2b" }, sku, dto);
  }

  @Delete("pro/items/:sku")
  @UseGuards(JwtAuthGuard, ProfessionalApprovedGuard)
  @RequireProfessional()
  removeProItem(@CurrentUser() user: JwtPayload, @Param("sku") sku: string) {
    return this.cartService.removeItem({ userId: user.sub, type: "b2b" }, sku);
  }

  // B2B cart endpoints — authenticated professionals only
  @Post("pro/items")
  @UseGuards(JwtAuthGuard, ProfessionalApprovedGuard)
  @RequireProfessional()
  addItemB2B(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddCartItemDto,
    @Headers("x-price-list-id") priceListId?: string,
  ) {
    return this.cartService.addItem({ userId: user.sub }, dto, "b2b", priceListId);
  }
}
