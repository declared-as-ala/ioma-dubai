import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

// CORS requires the exact requesting Origin, not just a matching host —
// found live: opening the dev site via http://127.0.0.1:3000 instead of
// http://localhost:3000 (both the same server, browsers treat them as
// different origins) got a response with Access-Control-Allow-Origin
// pinned to the other one, so the browser silently discarded every API
// response as a CORS violation. Only ever widens this for the two
// interchangeable local-dev hostnames — a production APP_URL (a real
// domain) is returned as-is, never expanded to include localhost.
function allowedOrigins(appUrl: string | undefined): string[] {
  if (!appUrl) return [];
  const url = new URL(appUrl);
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    return [appUrl];
  }
  const port = url.port ? `:${url.port}` : "";
  return [`${url.protocol}//localhost${port}`, `${url.protocol}//127.0.0.1${port}`];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  app.enableShutdownHooks();
  app.use(helmet());
  app.enableCors({
    // Storefront (APP_URL) and the separate admin app (ADMIN_APP_URL).
    origin: [
      ...allowedOrigins(process.env.APP_URL),
      ...allowedOrigins(process.env.ADMIN_APP_URL),
    ],
    credentials: true,
  });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("IOMA Paris Dubai API")
    .setDescription("REST API for the IOMA Paris Dubai digital platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}/api`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
