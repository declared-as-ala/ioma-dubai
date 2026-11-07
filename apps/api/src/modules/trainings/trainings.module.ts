import { DocumentsModule } from "../documents/documents.module";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Training, TrainingSchema } from "./schemas/training.schema";
import {
  TrainingSession,
  TrainingSessionSchema,
} from "./schemas/training-session.schema";
import {
  TrainingBooking,
  TrainingBookingSchema,
} from "./schemas/training-booking.schema";
import {
  ProfessionalProfile,
  ProfessionalProfileSchema,
} from "../professional/schemas/professional-profile.schema";
import { TrainingsService } from "./trainings.service";
import { TrainingsController } from "./trainings.controller";

@Module({
  imports: [
    DocumentsModule,
    MongooseModule.forFeature([
      { name: Training.name, schema: TrainingSchema },
      { name: TrainingSession.name, schema: TrainingSessionSchema },
      { name: TrainingBooking.name, schema: TrainingBookingSchema },
      { name: ProfessionalProfile.name, schema: ProfessionalProfileSchema },
    ]),
  ],
  controllers: [TrainingsController],
  providers: [TrainingsService],
  exports: [TrainingsService],
})
export class TrainingsModule {}
