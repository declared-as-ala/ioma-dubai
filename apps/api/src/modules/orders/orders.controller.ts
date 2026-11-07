import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { OptionalUser } from "../auth/decorators/optional-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import type { CartOwner } from "../cart/cart.service";
import { OrdersService } from "./orders.service";
import { CheckoutDto } from "./dto/checkout.dto";
import { RetryPaymentDto } from "./dto/retry-payment.dto";
import { RequireProfessional } from "../../common/guards/auth.decorators";
import { ProfessionalApprovedGuard } from "../../common/guards/professional-approved.guard";

function resolveOwner(
  user: JwtPayload | undefined,
  guestSessionId: string | undefined,
): CartOwner {
  return user
    ? {
        userId: user.sub,
        professionalApproved: user.roles.some((role) =>
          ["professional_approved", "administrator", "super_administrator"].includes(
            role,
          ),
        ),
      }
    : { sessionId: guestSessionId };
}

@ApiTags("orders")
@ApiHeader({
  name: "X-Guest-Session-Id",
  required: false,
  description:
    "Required for guest checkout — must match the header used to build the cart.",
})
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  checkout(
    @OptionalUser() user: JwtPayload | undefined,
    @Headers("x-guest-session-id") guestSessionId: string | undefined,
    @Body() dto: CheckoutDto,
  ) {
    return this.ordersService.checkout(resolveOwner(user, guestSessionId), dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: JwtPayload) {
    const isAdmin =
      user.roles.includes("administrator") || user.roles.includes("super_administrator");

    if (isAdmin) {
      return this.ordersService.listAll();
    }
    return this.ordersService.listOwn(user.sub);
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  listMy(@CurrentUser() user: JwtPayload) {
    return this.ordersService.listOwn(user.sub);
  }

  @Get(":orderNumber")
  @UseGuards(OptionalJwtAuthGuard)
  getOrder(
    @OptionalUser() user: JwtPayload | undefined,
    @Param("orderNumber") orderNumber: string,
    @Query("token") token?: string,
  ) {
    const owner = user
      ? {
          userId: user.sub,
          professionalApproved: user.roles.some((role) =>
            ["professional_approved", "administrator", "super_administrator"].includes(
              role,
            ),
          ),
        }
      : {};
    return this.ordersService.getOrder(orderNumber, { ...owner, guestToken: token });
  }

  @Post(":orderNumber/retry-payment")
  @UseGuards(OptionalJwtAuthGuard)
  retryPayment(
    @OptionalUser() user: JwtPayload | undefined,
    @Headers("x-guest-session-id") guestSessionId: string | undefined,
    @Param("orderNumber") orderNumber: string,
    @Query("token") token: string | undefined,
    @Body() dto: RetryPaymentDto,
  ) {
    const owner = user
      ? {
          userId: user.sub,
          professionalApproved: user.roles.some((role) =>
            ["professional_approved", "administrator", "super_administrator"].includes(
              role,
            ),
          ),
        }
      : { sessionId: guestSessionId, guestToken: token };
    return this.ordersService.retryPayment(orderNumber, owner, dto.paymentMethod);
  }

  @Post(":orderNumber/cancel")
  @UseGuards(OptionalJwtAuthGuard)
  cancel(
    @OptionalUser() user: JwtPayload | undefined,
    @Param("orderNumber") orderNumber: string,
    @Query("token") token?: string,
  ) {
    const owner = user
      ? {
          userId: user.sub,
          professionalApproved: user.roles.some((role) =>
            ["professional_approved", "administrator", "super_administrator"].includes(
              role,
            ),
          ),
        }
      : {};
    return this.ordersService.cancel(orderNumber, { ...owner, guestToken: token });
  }

  @Post("pro/checkout")
  @UseGuards(JwtAuthGuard, ProfessionalApprovedGuard)
  @RequireProfessional()
  checkoutB2B(@CurrentUser() user: JwtPayload, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(
      { userId: user.sub, type: "b2b", professionalApproved: true },
      dto,
    );
  }

  @Get("pro/list")
  @UseGuards(JwtAuthGuard, ProfessionalApprovedGuard)
  @RequireProfessional()
  listB2B(@CurrentUser() user: JwtPayload) {
    return this.ordersService.listB2B(user.sub);
  }
}
