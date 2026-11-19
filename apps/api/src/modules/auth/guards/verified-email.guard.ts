import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { adminPermissions } from "@ioma/config";
import type { JwtPayload } from "../strategies/jwt.strategy";

/**
 * Blocks sensitive actions for accounts whose email is not verified yet.
 * Requests without a user (guest checkout) pass through: pair it with JwtAuthGuard when login is mandatory.
 * Back-office accounts are exempt (they are created and vetted by IOMA).
 */
@Injectable()
export class VerifiedEmailGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: JwtPayload }>().user;
    if (!user) return true;
    if (user.emailVerified !== false) return true;
    if (adminPermissions(user.roles as never).length > 0) return true;
    throw new ForbiddenException({
      error: "EMAIL_NOT_VERIFIED",
      message: "Please verify your email address to continue.",
    });
  }
}
