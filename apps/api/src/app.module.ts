import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { BullModule } from "@nestjs/bullmq";
import { APP_GUARD } from "@nestjs/core";
import { join } from "path";
import { validateEnv, type EnvConfig } from "./config/env.validation";
import { RedisModule } from "./common/redis/redis.module";
import { StorageModule } from "./common/storage/storage.module";
import { MailModule } from "./common/mail/mail.module";
import { HealthModule } from "./modules/health/health.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ContactModule } from "./modules/contact/contact.module";
import { NewsletterModule } from "./modules/newsletter/newsletter.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CatalogSyncModule } from "./modules/catalog-sync/catalog-sync.module";
import { CartModule } from "./modules/cart/cart.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { AccountModule } from "./modules/account/account.module";
import { PartnersModule } from "./modules/partners/partners.module";
// AppointmentsModule deactivated: consumer appointment booking system removed.
// Schemas and historical data are preserved in database without dropping.
import { ProfessionalModule } from "./modules/professional/professional.module";
import { ProContentModule } from "./modules/pro-content/pro-content.module";
import { HeroModule } from "./modules/hero/hero.module";
import { TrainingsModule } from "./modules/trainings/trainings.module";
import { ProtocolsModule } from "./modules/protocols/protocols.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AdminModule } from "./modules/admin/admin.module";
import { MediaModule } from "./modules/media/media.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // @nestjs/config otherwise looks for `.env` in the process's CWD,
      // which for `pnpm --filter @ioma/api ...` is apps/api/, not the repo
      // root where `.env` actually lives — this failed silently (fell back
      // to whatever was already in process.env) until traced during Sprint
      // 1 testing. In Docker, this path simply doesn't exist and dotenv
      // no-ops, which is correct — compose injects real env vars directly.
      envFilePath: join(__dirname, "../../../.env"),
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI,
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) => {
        const url = new URL(config.get("REDIS_URL", { infer: true }));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            password: url.password || undefined,
            // Required by BullMQ's worker/blocking-command usage — see
            // https://docs.bullmq.io/guide/going-to-production#maxretriesperrequest
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    RedisModule,
    StorageModule,
    MailModule,
    MediaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    ContactModule,
    NewsletterModule,
    CatalogModule,
    CatalogSyncModule,
    CartModule,
    WishlistModule,
    PaymentsModule,
    OrdersModule,
    AccountModule,
    PartnersModule,
    ProfessionalModule,
    ProContentModule,
    HeroModule,
    TrainingsModule,
    ProtocolsModule,
    AuditModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
