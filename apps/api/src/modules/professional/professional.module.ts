import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import {
  ProfessionalApplication,
  ProfessionalApplicationSchema,
} from "./schemas/professional-application.schema";
import {
  ProfessionalProfile,
  ProfessionalProfileSchema,
} from "./schemas/professional-profile.schema";
import { PriceList, PriceListSchema } from "./schemas/price-list.schema";
import {
  ProfessionalLead,
  ProfessionalLeadSchema,
} from "./schemas/professional-lead.schema";
import { B2bSettings, B2bSettingsSchema } from "./schemas/b2b-settings.schema";
import { ProAccessService } from "./pro-access.service";
import { ProAccessController } from "./pro-access.controller";
import { AuthModule } from "../auth/auth.module";
import { ProfessionalService } from "./professional.service";
import { ProfessionalController } from "./professional.controller";
import { UsersModule } from "../users/users.module";
import { DocumentsModule } from "../documents/documents.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProfessionalApplication.name, schema: ProfessionalApplicationSchema },
      { name: ProfessionalProfile.name, schema: ProfessionalProfileSchema },
      { name: PriceList.name, schema: PriceListSchema },
      { name: ProfessionalLead.name, schema: ProfessionalLeadSchema },
      { name: B2bSettings.name, schema: B2bSettingsSchema },
    ]),
    PassportModule,
    UsersModule,
    DocumentsModule,
    AuthModule,
  ],
  controllers: [ProfessionalController, ProAccessController],
  providers: [ProfessionalService, ProAccessService],
  exports: [MongooseModule, ProfessionalService, ProAccessService],
})
export class ProfessionalModule {}
