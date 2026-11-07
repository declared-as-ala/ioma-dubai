import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HeroController } from "./hero.controller";
import { HeroService } from "./hero.service";
import { HeroSlide, HeroSlideSchema } from "./hero-slide.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HeroSlide.name, schema: HeroSlideSchema }]),
  ],
  controllers: [HeroController],
  providers: [HeroService],
})
export class HeroModule {}
