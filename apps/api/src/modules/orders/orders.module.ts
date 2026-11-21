import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { Order, OrderSchema } from "./schemas/order.schema";
import { CatalogModule } from "../catalog/catalog.module";
import { CartModule } from "../cart/cart.module";
import { PaymentsModule } from "../payments/payments.module";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { OrderNotificationsModule } from "./notifications/order-notifications.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    CatalogModule,
    CartModule,
    PaymentsModule,
    OrderNotificationsModule,
    PassportModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
