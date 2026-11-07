import { Module } from "@nestjs/common";
import { DocumentsModule } from "../documents/documents.module";
import { ProfessionalModule } from "../professional/professional.module";
import { ProContentController } from "./pro-content.controller";
import { ProContentService } from "./pro-content.service";

@Module({
  imports: [ProfessionalModule, DocumentsModule],
  controllers: [ProContentController],
  providers: [ProContentService],
})
export class ProContentModule {}
