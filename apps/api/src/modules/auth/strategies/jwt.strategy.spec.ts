import { JwtStrategy } from "./jwt.strategy";
import type { ConfigService } from "@nestjs/config";
import type { EnvConfig } from "../../../config/env.validation";
import type { UsersService } from "../../users/users.service";

describe("JWT authorization uses current database roles", () => {
  it("removes B2B access immediately after suspension with an old approved token", async () => {
    const users = {
      findById: jest.fn().mockResolvedValue({
        email: "pro@example.com",
        roles: ["customer", "professional_suspended"],
      }),
    };
    const strategy = new JwtStrategy(
      { get: () => "test-secret" } as unknown as ConfigService<EnvConfig, true>,
      users as unknown as UsersService,
    );
    const result = await strategy.validate({
      sub: "user",
      email: "pro@example.com",
      roles: ["professional_approved"],
    });
    expect(result.roles).not.toContain("professional_approved");
    expect(result.roles).toContain("professional_suspended");
  });
});
