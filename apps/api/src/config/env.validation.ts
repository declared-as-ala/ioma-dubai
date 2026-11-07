import { z } from "zod";

// Fails API boot loudly on missing/invalid required variables — see SECURITY.md
// "Environment & Secrets" and CLAUDE.md "no secrets committed / no silent fallback".
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url(),
  // Origin of the separate admin app (apps/admin); allowed by CORS.
  ADMIN_APP_URL: z.string().url().optional(),
  API_URL: z.string().url(),

  MONGO_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),

  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number(),
  MINIO_ACCESS_KEY: z.string().default("ioma_minio_admin"),
  MINIO_SECRET_KEY: z.string().default("ioma_minio_secret_2026"),
  // NOT z.coerce.boolean() — Zod's coercion is just JS `Boolean(value)`,
  // and Boolean("false") is `true` (any non-empty string is truthy). That
  // silently flipped MINIO_USE_SSL=false in .env to `true`, making the
  // MinIO client attempt a TLS handshake against the dev stack's plaintext
  // endpoint ("SSL routines:tls_get_more_records: packet length too long").
  // Found live, the first time the API itself (not just the bucket-init
  // script) actually connected to MinIO — see PROGRESS.md.
  MINIO_USE_SSL: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  MINIO_BUCKET_PUBLIC: z.string().default("ioma-public"),
  MINIO_BUCKET_PRIVATE: z.string().default("ioma-private"),
  MINIO_SIGNED_URL_TTL_SECONDS: z.coerce.number().default(300),
  MINIO_SIGNED_URL_ENDPOINT: z.string().url().optional(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  PAYMENT_PROVIDER: z.string().default("mock"),
  PAYMENT_API_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),

  AI_PROVIDER: z.string().optional(),
  AI_PROVIDER_API_KEY: z.string().optional(),
  AI_ANALYSIS_RETENTION_DAYS: z.coerce.number().optional(),

  MAP_PROVIDER: z.string().default("osm"),
  MAPS_API_KEY: z.string().optional(),

  EMAIL_PROVIDER: z.string().default("smtp-dev"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("no-reply@ioma-dev.local"),
  // Where new contact-form messages are announced. Optional: messages are always stored either way.
  CONTACT_NOTIFY_EMAIL: z.string().email().optional(),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().default(45),

  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.string().default("debug"),

  SEARCH_PROVIDER: z.string().default("mongo"),
  DEFAULT_LOCALE: z.string().default("en"),
  SUPPORTED_LOCALES: z.string().default("en,ar"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    // Intentionally loud + fatal: see SECURITY.md "Environment & Secrets".
    throw new Error(
      `\n\nInvalid environment configuration:\n${formatted}\n\nCheck ENVIRONMENT.md and your .env file.\n`,
    );
  }

  if (result.data.NODE_ENV === "production" && result.data.PAYMENT_PROVIDER === "mock") {
    console.warn(
      "[env] WARNING: PAYMENT_PROVIDER=mock in production. This is only " +
        "acceptable for a deliberately mock-payment soft launch — see DECISIONS.md.",
    );
  }

  return result.data;
}
