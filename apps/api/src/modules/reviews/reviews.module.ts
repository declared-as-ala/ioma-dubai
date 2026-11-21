import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ReviewsService } from "./reviews.service";
import { AdminReviewsController, ReviewsController } from "./reviews.controller";

@Module({
  imports: [AuditModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
