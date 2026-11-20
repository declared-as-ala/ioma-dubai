import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PriceImportController } from "./price-import.controller";
import { PriceImportService } from "./price-import.service";

@Module({
  imports: [AuditModule],
  controllers: [PriceImportController],
  providers: [PriceImportService],
})
export class PriceImportModule {}
