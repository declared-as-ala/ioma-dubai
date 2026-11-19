import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailService } from "./mail.service";
import { MailOutboxService } from "./mail-outbox.service";
import { MailOutbox, MailOutboxSchema } from "./mail-outbox.schema";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: MailOutbox.name, schema: MailOutboxSchema }]),
  ],
  providers: [MailService, MailOutboxService],
  exports: [MailService, MailOutboxService],
})
export class MailModule {}
