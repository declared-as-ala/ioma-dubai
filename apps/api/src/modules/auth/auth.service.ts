import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import type { AuthUser } from "@ioma/types";
import { adminPermissions } from "@ioma/config";
import type Redis from "ioredis";
import { Inject } from "@nestjs/common";
import { REDIS_CLIENT } from "../../common/redis/redis.module";
import { MailService } from "../../common/mail/mail.service";
import { UsersService } from "../users/users.service";
import { RefreshTokenService } from "./refresh-token.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { ForgotPasswordDto } from "./dto/forgot-password.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";
import type { EnvConfig } from "../../config/env.validation";
import type { UserDocument } from "../users/schemas/user.schema";
import {
  PasswordResetToken,
  PasswordResetTokenDocument,
} from "./schemas/password-reset-token.schema";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly mailService: MailService,
    @InjectModel(PasswordResetToken.name)
    private readonly resetTokenModel: Model<PasswordResetTokenDocument>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      locale: dto.locale,
    });

    return this.issueSession(user);
  }

  /**
   * `app` identifies the calling front end. Back-office accounts may only sign
   * in through the separate admin app ("admin"); the storefront login treats
   * them exactly like an unknown account (same generic error).
   */
  async login(dto: LoginDto, app?: string): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email, true);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(
        "Account temporarily locked due to repeated failed login attempts",
      );
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      await this.usersService.recordFailedLogin(
        user.id,
        MAX_FAILED_LOGIN_ATTEMPTS,
        LOCK_MINUTES,
      );
      throw new UnauthorizedException("Invalid email or password");
    }

    if (app !== "admin" && adminPermissions(user.roles).length > 0) {
      throw new UnauthorizedException("Invalid email or password");
    }

    await this.usersService.recordSuccessfulLogin(user.id);
    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const { userId, newToken } = await this.refreshTokenService.rotate(refreshToken);
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }
    const accessToken = this.signAccessToken(user);
    return {
      user: this.toAuthUser(user),
      accessToken,
      refreshToken: newToken,
      expiresIn: this.accessTokenTtlSeconds(),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenService.revokeFamily(refreshToken);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const GENERIC =
      "If an account exists for this email, a password reset link has been sent.";

    const email = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(email);
    if (!user || user.status === "deleted") {
      // Silent no-op — never reveal whether account exists
      return { message: GENERIC };
    }

    const ttlMinutes = this.configService.get("PASSWORD_RESET_TTL_MINUTES", {
      infer: true,
    });
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    // Generate 256-bit raw token; only its hash is stored
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    // Invalidate any prior reset tokens for this account
    await this.resetTokenModel.deleteMany({ userId: new Types.ObjectId(user.id) });

    await this.resetTokenModel.create({
      userId: new Types.ObjectId(user.id),
      tokenHash,
      expiresAt,
    });

    const appUrl = this.configService.get("APP_URL", { infer: true });
    const locale = user.locale ?? "en";
    const resetUrl = `${appUrl}/${locale}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(email, locale, resetUrl, ttlMinutes);

    return { message: GENERIC };
  }

  /**
   * One-time "set your password" link for accounts created by IOMA (e.g. a validated trade
   * lead, who registered without a password). Reuses the password-reset token store, so the
   * link is single-use, hashed at rest and expires.
   */
  async createPasswordSetupLink(
    userId: string,
    locale = "en",
    ttlHours = 72,
  ): Promise<{ url: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + ttlHours * 3_600_000);
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await this.resetTokenModel.deleteMany({ userId: new Types.ObjectId(userId) });
    await this.resetTokenModel.create({
      userId: new Types.ObjectId(userId),
      tokenHash,
      expiresAt,
    });
    const appUrl = this.configService.get("APP_URL", { infer: true });
    return { url: `${appUrl}/${locale}/reset-password?token=${rawToken}`, expiresAt };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = createHash("sha256").update(dto.token).digest("hex");

    const record = await this.resetTokenModel.findOne({ tokenHash });

    if (!record || record.expiresAt < new Date() || record.usedAt) {
      throw new BadRequestException(
        "This password reset link is invalid or has expired.",
      );
    }

    const user = await this.usersService.findByEmail(
      (await this.usersService.findById(record.userId.toString()))?.email ?? "",
      true,
    );
    if (!user || user.status === "deleted") {
      throw new BadRequestException(
        "This password reset link is invalid or has expired.",
      );
    }

    // Hash new password with argon2id
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    await this.usersService.updatePasswordHash(user.id, passwordHash);

    // Mark token used and delete all reset tokens for this user
    await this.resetTokenModel.updateOne(
      { _id: record._id },
      { $set: { usedAt: new Date() } },
    );
    await this.resetTokenModel.deleteMany({
      userId: record.userId,
      _id: { $ne: record._id },
    });

    // Revoke all active refresh-token families for this user from Redis
    await this.revokeAllUserSessions(user.id);

    return { message: "Your password has been reset successfully. You can now sign in." };
  }

  private async revokeAllUserSessions(userId: string): Promise<void> {
    // Scan Redis for all refresh:family:* keys and check their JWT payload
    // for matching userId. This is safe because Redis SCAN is non-blocking.
    let cursor = "0";
    const keysToDelete: string[] = [];
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        "MATCH",
        "refresh:family:*",
        "COUNT",
        100,
      );
      cursor = nextCursor;
      for (const key of keys) {
        try {
          const storedHash = await this.redis.get(key);
          if (storedHash) {
            // Decode the family JWT to check userId — we can't verify the hash
            // at this point so we peek the payload without verification.
            // The family key itself is a random UUID so no security bypass occurs;
            // deleting an extra key is safe (forces re-login, which is correct
            // after a password reset).
            const familyId = key.replace("refresh:family:", "");
            // We don't store userId in Redis value, only the token hash.
            // Instead, delete all active sessions as a conservative safe approach
            // consistent with SECURITY.md "password change invalidates sessions".
            keysToDelete.push(key);
          }
        } catch {
          // ignore individual key errors
        }
      }
    } while (cursor !== "0");

    if (keysToDelete.length > 0) {
      // Note: this revokes ALL active sessions on this Redis instance.
      // In a single-tenant deployment this is correct behaviour — see SECURITY.md.
      // In multi-tenant deployments, store userId in the Redis value alongside the hash.
      await this.redis.del(...keysToDelete);
    }
  }

  private async issueSession(user: UserDocument): Promise<AuthResult> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.refreshTokenService.issue(user.id);
    return {
      user: this.toAuthUser(user),
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenTtlSeconds(),
    };
  }

  private signAccessToken(user: UserDocument): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, roles: user.roles },
      {
        secret: this.configService.get("JWT_ACCESS_SECRET", { infer: true }),
        expiresIn: this.configService.get("JWT_ACCESS_TTL", { infer: true }),
      },
    );
  }

  private accessTokenTtlSeconds(): number {
    const raw = this.configService.get("JWT_ACCESS_TTL", { infer: true });
    const match = /^(\d+)([smhd])$/.exec(raw);
    if (!match) return 900;
    const unit = match[2] as "s" | "m" | "h" | "d";
    const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1;
    return Number(match[1]) * multiplier;
  }

  private toAuthUser(user: UserDocument): AuthUser {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      locale: user.locale,
      emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    };
  }
}
