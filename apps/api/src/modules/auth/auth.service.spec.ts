import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { RefreshTokenService } from "./refresh-token.service";
import { MailService } from "../../common/mail/mail.service";
import { PasswordResetToken } from "./schemas/password-reset-token.schema";
import { REDIS_CLIENT } from "../../common/redis/redis.module";
import type { UserDocument } from "../users/schemas/user.schema";

// Mongoose's HydratedDocument<User> is too recursive for jest.Mocked<T> to
// unify cleanly with plain mock return values, so these mocks are typed
// loosely on purpose — this is a unit test of AuthService's own logic, not
// of Mongoose's document typing.
interface MockedUsersService {
  findByEmail: jest.Mock;
  create: jest.Mock;
  recordFailedLogin: jest.Mock;
  recordSuccessfulLogin: jest.Mock;
  findById: jest.Mock;
}

interface MockedRefreshTokenService {
  issue: jest.Mock;
  rotate: jest.Mock;
  revokeFamily: jest.Mock;
}

describe("AuthService", () => {
  jest.setTimeout(30000);
  let authService: AuthService;
  let usersService: MockedUsersService;
  let refreshTokenService: MockedRefreshTokenService;

  const configValues: Record<string, string> = {
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_ACCESS_TTL: "15m",
    JWT_REFRESH_SECRET: "b".repeat(32),
    JWT_REFRESH_TTL: "30d",
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            recordFailedLogin: jest.fn(),
            recordSuccessfulLogin: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            issue: jest.fn().mockResolvedValue("mock-refresh-token"),
            rotate: jest.fn(),
            revokeFamily: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("mock-access-token"),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => configValues[key],
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getModelToken(PasswordResetToken.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            updateMany: jest.fn(),
          },
        },
        {
          provide: REDIS_CLIENT,
          useValue: {
            keys: jest.fn().mockResolvedValue([]),
            del: jest.fn().mockResolvedValue(0),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    usersService = moduleRef.get(UsersService) as unknown as MockedUsersService;
    refreshTokenService = moduleRef.get(
      RefreshTokenService,
    ) as unknown as MockedRefreshTokenService;
  });

  describe("register", () => {
    it("hashes the password and never stores it in plaintext", async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation(async (data) => {
        expect(data.passwordHash).not.toBe("SuperSecret123");
        expect(await argon2.verify(data.passwordHash, "SuperSecret123")).toBe(true);
        return {
          id: "user-1",
          email: data.email,
          roles: ["customer"],
          locale: "en",
          emailVerifiedAt: null,
        } as unknown as UserDocument;
      });

      const result = await authService.register({
        email: "test@ioma.com",
        password: "SuperSecret123",
        firstName: "Jane",
        lastName: "Doe",
      });

      expect(result.accessToken).toBe("mock-access-token");
      expect(result.refreshToken).toBe("mock-refresh-token");
      expect(usersService.create).toHaveBeenCalled();
    });

    it("rejects registration with an already-used email", async () => {
      usersService.findByEmail.mockResolvedValue({
        id: "existing",
      } as unknown as UserDocument);

      await expect(
        authService.register({
          email: "taken@ioma.com",
          password: "SuperSecret123",
          firstName: "Jane",
          lastName: "Doe",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("login", () => {
    it("rejects an incorrect password without revealing which field was wrong", async () => {
      const passwordHash = await argon2.hash("CorrectPassword1", {
        type: argon2.argon2id,
      });
      usersService.findByEmail.mockResolvedValue({
        id: "user-1",
        email: "test@ioma.com",
        passwordHash,
        roles: ["customer"],
        locale: "en",
        emailVerifiedAt: null,
        lockedUntil: null,
      } as unknown as UserDocument);

      await expect(
        authService.login({ email: "test@ioma.com", password: "WrongPassword" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(usersService.recordFailedLogin).toHaveBeenCalled();
    });

    it("rejects login while the account is locked, even with the right password", async () => {
      const passwordHash = await argon2.hash("CorrectPassword1", {
        type: argon2.argon2id,
      });
      usersService.findByEmail.mockResolvedValue({
        id: "user-1",
        email: "test@ioma.com",
        passwordHash,
        roles: ["customer"],
        locale: "en",
        emailVerifiedAt: null,
        lockedUntil: new Date(Date.now() + 60_000),
      } as unknown as UserDocument);

      await expect(
        authService.login({ email: "test@ioma.com", password: "CorrectPassword1" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("login — back-office accounts", () => {
    const adminUser = async () =>
      ({
        id: "admin-1",
        email: "admin@ioma.com",
        passwordHash: await argon2.hash("CorrectPassword1", { type: argon2.argon2id }),
        roles: ["super_administrator"],
        locale: "en",
        emailVerifiedAt: null,
        lockedUntil: null,
      }) as unknown as UserDocument;

    it("refuses an admin account on the storefront login with the generic error", async () => {
      usersService.findByEmail.mockResolvedValue(await adminUser());

      await expect(
        authService.login({ email: "admin@ioma.com", password: "CorrectPassword1" }),
      ).rejects.toThrow("Invalid email or password");
      expect(usersService.recordSuccessfulLogin).not.toHaveBeenCalled();
    });

    it("lets an admin account sign in from the admin app", async () => {
      usersService.findByEmail.mockResolvedValue(await adminUser());

      const result = await authService.login(
        { email: "admin@ioma.com", password: "CorrectPassword1" },
        "admin",
      );

      expect(result.accessToken).toBe("mock-access-token");
      expect(usersService.recordSuccessfulLogin).toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("propagates rotation failure (e.g. reuse detection) as Unauthorized", async () => {
      refreshTokenService.rotate.mockRejectedValue(new UnauthorizedException());

      await expect(authService.refresh("stolen-token")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
