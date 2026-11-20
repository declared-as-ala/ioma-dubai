import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { DocumentsModule } from "../documents/documents.module";
import { ProfessionalModule } from "../professional/professional.module";
import {
  AdminPortalContentController,
  ProContentController,
} from "./pro-content.controller";
import { PortalContentService } from "./portal-content.service";
import { ProContentService } from "./pro-content.service";

@Module({
  imports: [ProfessionalModule, DocumentsModule, AuditModule],
  controllers: [ProContentController, AdminPortalContentController],
  providers: [ProContentService, PortalContentService],
})
export class ProContentModule {}
