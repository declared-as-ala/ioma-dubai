import { RequireProfessional } from "../../common/guards/auth.decorators";
import { Controller, Get, Post, Patch, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ProfessionalApprovedGuard } from "../../common/guards/professional-approved.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { TrainingsService } from "./trainings.service";

@Controller()
@RequireProfessional()
@UseGuards(JwtAuthGuard, ProfessionalApprovedGuard)
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get("trainings")
  async listTrainings() {
    return this.trainingsService.listTrainings();
  }

  @Get("trainings/my-bookings")
  @UseGuards(JwtAuthGuard)
  async listMyBookings(@CurrentUser() user: JwtPayload) {
    return this.trainingsService.listMyBookings(user.sub);
  }

  @Get("trainings/:slug")
  async getTrainingBySlug(@Param("slug") slug: string) {
    return this.trainingsService.getTrainingBySlug(slug);
  }

  @Get("trainings/:id/sessions")
  async listSessions(@Param("id") id: string) {
    return this.trainingsService.listSessions(id);
  }

  @Post("trainings/sessions/:id/book")
  @UseGuards(JwtAuthGuard, ProfessionalApprovedGuard)
  async bookSession(@CurrentUser() user: JwtPayload, @Param("id") sessionId: string) {
    return this.trainingsService.bookSession(user.sub, sessionId);
  }

  @Get("trainings/my-bookings/:id/certificate")
  certificate(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.trainingsService.certificate(user.sub, id);
  }

  @Patch("trainings/my-bookings/:id/cancel")
  @UseGuards(JwtAuthGuard)
  async cancelBooking(@CurrentUser() user: JwtPayload, @Param("id") bookingId: string) {
    return this.trainingsService.cancelBooking(user.sub, bookingId);
  }
}
