import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { DocumentsModule } from "../documents/documents.module";
import { ReviewsService } from "./reviews.service";
import { AdminReviewsController, ReviewsController } from "./reviews.controller";

@Module({
  imports: [AuditModule, DocumentsModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
