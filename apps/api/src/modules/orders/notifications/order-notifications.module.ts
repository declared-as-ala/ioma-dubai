import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { OrderNotificationsService } from "./order-notifications.service";
import { OrderNotificationsController } from "./order-notifications.controller";

@Module({
  imports: [PassportModule],
  controllers: [OrderNotificationsController],
  providers: [OrderNotificationsService],
  exports: [OrderNotificationsService],
})
export class OrderNotificationsModule {}
