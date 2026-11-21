import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { VerifiedEmailGuard } from "../auth/guards/verified-email.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { OptionalUser } from "../auth/decorators/optional-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { ReviewsService } from "./reviews.service";

@ApiTags("reviews")
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Published reviews and real statistics for a product (public). */
  @Get("products/:slug/reviews")
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Param("slug") slug: string,
    @OptionalUser() user: JwtPayload | undefined,
    @Query() query: Record<string, string>,
  ) {
    return this.reviews.listForProduct(slug, user, query);
  }

  /** A signed-in customer submits a review; it waits for moderation. */
  @Post("products/:slug/reviews")
  @UseGuards(JwtAuthGuard, VerifiedEmailGuard)
  create(
    @Param("slug") slug: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, unknown>,
  ) {
    return this.reviews.create(slug, user, body);
  }

  @Delete("reviews/:id")
  @UseGuards(JwtAuthGuard)
  withdraw(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.reviews.withdraw(user, id);
  }
}

@ApiTags("admin-reviews")
@Controller("admin/reviews")
@UseGuards(JwtAuthGuard)
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: Record<string, string>) {
    return this.reviews.adminList(user, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: JwtPayload) {
    return this.reviews.adminStats(user);
  }

  @Get(":id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.reviews.adminGet(user, id);
  }

  @Patch(":id/moderate")
  moderate(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.reviews.moderate(user, id, body);
  }

  @Patch(":id/reply")
  reply(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.reviews.reply(user, id, body);
  }
}
