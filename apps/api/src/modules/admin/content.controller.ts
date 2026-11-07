import { Controller, Get, Param, Query, NotFoundException, Res } from "@nestjs/common";
import type { Response } from "express";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

@Controller("content")
export class ContentController {
  constructor(@InjectConnection() private readonly db: Connection) {}

  @Get(["journal", "magazine"])
  async listArticles(
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Query("limit") limitStr?: string,
    @Query("page") pageStr?: string,
  ): Promise<{
    items: Record<string, any>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: Record<string, any> = {
      kind: { $in: ["journal", "magazine"] },
      status: "published",
    };

    if (category && category !== "all") {
      filter.$or = [
        { categorySlug: category },
        { "category.en": category },
        { "category.fr": category },
      ];
    }

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      const searchOr = [
        { "title.en": regex },
        { "title.fr": regex },
        { "title.ar": regex },
        { "summary.en": regex },
        { "summary.fr": regex },
        { "summary.ar": regex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    const limit = Math.min(Math.max(parseInt(limitStr || "100", 10) || 100, 1), 200);
    const page = Math.max(parseInt(pageStr || "1", 10) || 1, 1);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.db
        .collection("contentpages")
        .find(filter, {
          projection: {
            slug: 1,
            kind: 1,
            title: 1,
            summary: 1,
            excerpt: 1,
            coverImage: 1,
            category: 1,
            categorySlug: 1,
            author: 1,
            datePublished: 1,
            readingTimeMinutes: 1,
            sourceUrl: 1,
            updatedAt: 1,
            createdAt: 1,
          },
        })
        .sort({ datePublished: -1, updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.db.collection("contentpages").countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  @Get(":kind/:slug")
  async page(
    @Param("kind") kind: string,
    @Param("slug") slug: string,
    @Res() response: Response,
  ): Promise<void> {
    if (
      ![
        "page",
        "homepage",
        "journal",
        "magazine",
        "faq",
        "navigation",
        "footer",
      ].includes(kind)
    )
      throw new NotFoundException();

    // Allow fetching articles regardless of whether kind is journal or magazine
    const kindFilter = ["journal", "magazine"].includes(kind)
      ? { $in: ["journal", "magazine"] }
      : kind;

    const page = await this.db.collection("contentpages").findOne(
      { kind: kindFilter, slug, status: "published" },
      {
        projection: {
          slug: 1,
          kind: 1,
          title: 1,
          summary: 1,
          excerpt: 1,
          blocks: 1,
          htmlBody: 1,
          coverImage: 1,
          category: 1,
          categorySlug: 1,
          author: 1,
          datePublished: 1,
          readingTimeMinutes: 1,
          sourceUrl: 1,
          seoTitle: 1,
          seoDescription: 1,
          updatedAt: 1,
        },
      },
    );
    response.json(page ?? null);
  }
}
