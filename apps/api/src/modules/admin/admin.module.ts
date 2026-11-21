import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { DocumentsModule } from "../documents/documents.module";
import { AppointmentsModule } from "../appointments/appointments.module";
import { TrainingsModule } from "../trainings/trainings.module";
import { PartnersModule } from "../partners/partners.module";
import { AdminController } from "./admin.controller";
import { ContentController } from "./content.controller";
import { AdminDashboardService } from "./admin-dashboard.service";
import { AdminResourcesService } from "./admin-resources.service";
import { AdminActionsService } from "./admin-actions.service";
import { OrderNotificationsModule } from "../orders/notifications/order-notifications.module";

@Module({
  imports: [
    AuditModule,
    DocumentsModule,
    AppointmentsModule,
    TrainingsModule,
    PartnersModule,
    OrderNotificationsModule,
  ],
  controllers: [AdminController, ContentController],
  providers: [AdminDashboardService, AdminResourcesService, AdminActionsService],
})
export class AdminModule {}
