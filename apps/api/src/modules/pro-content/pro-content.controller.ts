import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { ProContentService } from "./pro-content.service";

@ApiTags("pro-content")
@UseGuards(JwtAuthGuard)
@Controller("pro")
export class ProContentController {
  constructor(private readonly content: ProContentService) {}

  @Get("videos")
  videos(@CurrentUser() user: JwtPayload) {
    return this.content.videos(user.sub, user.roles);
  }

  @Get("gallery")
  gallery(@CurrentUser() user: JwtPayload) {
    return this.content.gallery(user.sub, user.roles);
  }

  @Get("benefits")
  benefits(@CurrentUser() user: JwtPayload) {
    return this.content.benefits(user.sub, user.roles);
  }

  @Get("documents")
  documents(@CurrentUser() user: JwtPayload) {
    return this.content.documentsList(user.sub, user.roles);
  }

  @Get("documents/:id/url")
  documentUrl(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.content.documentUrl(user.sub, user.roles, id);
  }
}
