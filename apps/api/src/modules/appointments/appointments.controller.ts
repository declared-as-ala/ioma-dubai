import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { AppointmentsService } from "./appointments.service";
import {
  CreateAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
} from "./dto/appointment.dto";
import { VerifiedEmailGuard } from "../auth/guards/verified-email.guard";

@ApiTags("appointments")
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, VerifiedEmailGuard)
  book(@CurrentUser() user: JwtPayload, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.book(user.sub, dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: JwtPayload) {
    return this.appointmentsService.listMine(user.sub);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  getById(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.appointmentsService.getById(user.sub, id);
  }

  @Patch(":id/reschedule")
  @UseGuards(JwtAuthGuard)
  reschedule(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(user.sub, id, dto);
  }

  @Post(":id/cancel")
  @UseGuards(JwtAuthGuard)
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(user.sub, id, dto.reason);
  }
}
