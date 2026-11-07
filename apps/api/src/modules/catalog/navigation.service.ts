import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  NavigationMenu,
  NavigationMenuDocument,
  NavigationItem,
} from "./schemas/navigation-menu.schema";
import { Category, CategoryDocument } from "./schemas/category.schema";
import { SkinConcern, SkinConcernDocument } from "./schemas/skin-concern.schema";
import { ProductRange, ProductRangeDocument } from "./schemas/product-range.schema";
import { Product, ProductDocument } from "./schemas/product.schema";
import { ProductVariant, ProductVariantDocument } from "./schemas/product-variant.schema";
import { ProductMediaService } from "../media/product-media.service";
import { PRODUCT_RANGE_COLORS } from "@ioma/config";

export interface NavigationHealthDiagnostic {
  isValid: boolean;
  itemCount: number;
  warnings: string[];
  errors: string[];
  translations: {
    en: boolean;
    fr: boolean;
    ar: boolean;
    missingArCount: number;
  };
  emptyCategories: { slug: string; name: string }[];
  missingProducts: string[];
}

export const DEFAULT_HEADER_ITEMS: NavigationItem[] = [
  {
    id: "nav-uv-protection",
    slug: "uv-protection",
    label: {
      en: "UV & Protection",
      fr: "UV & Protection",
      ar: "الحماية من الشمس",
    },
    type: "DIRECT_LINK",
    url: "/shop?category=protection-solaire",
    sortOrder: 1,
    visibleDesktop: true,
    visibleMobile: true,
    simpleDropdownItems: [],
    megaMenuSections: [],
  },
  {
    id: "nav-bespoke",
    slug: "soins-sur-mesure",
    label: {
      en: "Bespoke Skincare",
      fr: "Soins Sur Mesure",
      ar: "عناية مخصصة",
    },
    type: "SIMPLE_DROPDOWN",
    url: "/shop?category=soins-sur-mesure",
    sortOrder: 2,
    visibleDesktop: true,
    visibleMobile: true,
    simpleDropdownItems: [
      {
        id: "bespoke-1",
        label: { en: "Ma Crème Jour", fr: "Ma Crème Jour", ar: "كريم النهار المخصص" },
        targetType: "product",
        url: "/shop/ma-creme-jour",
        badge: { en: "30ml / 50ml", fr: "30ml / 50ml", ar: "30 مل / 50 مل" },
        sortOrder: 1,
      },
      {
        id: "bespoke-2",
        label: { en: "Ma Crème Nuit", fr: "Ma Crème Nuit", ar: "كريم الليل المخصص" },
        targetType: "product",
        url: "/shop/ma-creme-nuit",
        badge: { en: "30ml / 50ml", fr: "30ml / 50ml", ar: "30 مل / 50 مل" },
        sortOrder: 2,
      },
      {
        id: "bespoke-3",
        label: { en: "Mon Sérum", fr: "Mon Sérum", ar: "سيروم مخصص" },
        targetType: "product",
        url: "/shop/mon-serum",
        badge: { en: "30ml", fr: "30ml", ar: "30 مل" },
        sortOrder: 3,
      },
      {
        id: "bespoke-4",
        label: { en: "Mon Soin Yeux", fr: "Mon Soin Yeux", ar: "عناية العيون المخصصة" },
        targetType: "product",
        url: "/shop/mon-soin-yeux",
        badge: { en: "30ml", fr: "30ml", ar: "30 مل" },
        sortOrder: 4,
      },
    ],
    megaMenuSections: [],
  },
  {
    id: "nav-visage",
    slug: "visage",
    label: {
      en: "Face",
      fr: "Visage",
      ar: "الوجه",
    },
    type: "MEGA_MENU",
    url: "/shop",
    sortOrder: 3,
    visibleDesktop: true,
    visibleMobile: true,
    simpleDropdownItems: [],
    megaMenuSections: [
      {
        id: "sec-concerns",
        title: {
          en: "Your Concerns",
          fr: "Vos Préoccupations",
          ar: "اهتمامات بشرتك",
        },
        type: "SKIN_CONCERNS",
        sortOrder: 1,
        visible: true,
        config: {
          selectionMode: "all_active",
          selectedSlugs: [
            "dehydration",
            "first-signs-of-aging",
            "fatigue-dullness",
            "sensitivity",
            "blemishes",
            "shine-control",
            "dark-spots",
            "menopause",
            "uv-protection",
          ],
        },
      },
      {
        id: "sec-categories",
        title: {
          en: "Our Categories",
          fr: "Nos Catégories",
          ar: "فئاتنا",
        },
        type: "PRODUCT_CATEGORIES",
        sortOrder: 2,
        visible: true,
        config: {
          selectionMode: "manual",
          selectedSlugs: [
            "serums",
            "cremes",
            "nettoyants",
            "demaquillants",
            "masques",
            "soins-yeux-levres",
            "protection-solaire",
            "soins-sur-mesure",
          ],
        },
      },
      {
        id: "sec-ranges",
        title: {
          en: "Our Ranges",
          fr: "Nos Gammes",
          ar: "مجموعاتنا",
        },
        type: "PRODUCT_RANGES",
        sortOrder: 3,
        visible: true,
        config: {
          includeBestSellers: true,
          ranges: [
            { key: "hydra", num: 1, name: "Hydra", color: "#00A3E0" },
            { key: "energize", num: 2, name: "Energize", color: "#FF8200" },
            { key: "renew", num: 3, name: "Renew", color: "#E40046" },
            { key: "calm", num: 4, name: "Calm", color: "#78BE20" },
            { key: "purete", num: 5, name: "Pureté", color: "#00A396" },
            { key: "matte", num: 6, name: "Matte", color: "#8A8D8F" },
            { key: "illumine", num: 7, name: "Illumine", color: "#6D2077" },
          ],
        },
      },
      {
        id: "sec-featured",
        title: {
          en: "Featured Product",
          fr: "Produit Phare",
          ar: "منتج مميز",
        },
        type: "FEATURED_PRODUCT",
        sortOrder: 4,
        visible: true,
        config: {
          productSlug: "creme-sublime-revitalisante",
          badge: {
            en: "Iconic Skincare",
            fr: "Soin Iconique",
            ar: "عناية أيقونية",
          },
          headlineOverride: {
            en: "Crème Sublime Revitalisante",
            fr: "Crème Sublime Revitalisante",
            ar: "كريم سوبليم لتجديد الحيوية",
          },
          descriptionOverride: {
            en: "High cellular anti-aging regeneration with exceptional active ingredients.",
            fr: "Haute régénération cellulaire anti-âge aux actifs d'exception et résultats visibles.",
            ar: "تجديد خلوي فائق لمكافحة علامات التقدم في السن بمكونات نشطة استثنائية.",
          },
          ctaLabel: {
            en: "Discover All",
            fr: "Découvrir tout",
            ar: "اكتشفي المزيد",
          },
          enabled: true,
        },
      },
    ],
  },
  {
    id: "nav-corps",
    slug: "corps",
    label: {
      en: "Body",
      fr: "Corps",
      ar: "الجسم",
    },
    type: "DIRECT_LINK",
    url: "/shop?category=corps",
    sortOrder: 4,
    visibleDesktop: true,
    visibleMobile: true,
    simpleDropdownItems: [],
    megaMenuSections: [],
  },
  {
    id: "nav-cheveux",
    slug: "cheveux",
    label: {
      en: "Hair",
      fr: "Cheveux",
      ar: "الشعر",
    },
    type: "DIRECT_LINK",
    url: "/shop?category=cheveux",
    sortOrder: 5,
    visibleDesktop: true,
    visibleMobile: true,
    simpleDropdownItems: [],
    megaMenuSections: [],
  },
  {
    id: "nav-routines",
    slug: "routines",
    label: {
      en: "Kits & Routines",
      fr: "Kits & Routines",
      ar: "مجموعات وروتين",
    },
    type: "DIRECT_LINK",
    url: "/shop?category=routines",
    sortOrder: 6,
    visibleDesktop: true,
    visibleMobile: true,
    simpleDropdownItems: [],
    megaMenuSections: [],
  },
  {
    id: "nav-inside",
    slug: "inside-ioma",
    label: {
      en: "Inside IOMA",
      fr: "Inside IOMA",
      ar: "داخل آيوما",
    },
    type: "SIMPLE_DROPDOWN",
    url: "/about",
    sortOrder: 7,
    visibleDesktop: true,
    visibleMobile: true,
    simpleDropdownItems: [
      {
        id: "inside-1",
        label: { en: "About", fr: "About", ar: "من نحن" },
        targetType: "page",
        url: "/about",
        badge: {
          en: "Parisian Philosophy",
          fr: "Philosophie Parisienne",
          ar: "الفلسفة الباريسية",
        },
        sortOrder: 1,
      },
      {
        id: "inside-2",
        label: { en: "Technology", fr: "Technology", ar: "التكنولوجيا" },
        targetType: "page",
        url: "/technology",
        badge: { en: "MEMS Sensors", fr: "Capteurs MEMS", ar: "مستشعرات MEMS" },
        sortOrder: 2,
      },
      {
        id: "inside-3",
        label: { en: "Journal", fr: "Journal", ar: "المجلة" },
        targetType: "page",
        url: "/journal",
        badge: { en: "Skin Science", fr: "Science & Rituels", ar: "علم البشرة" },
        sortOrder: 3,
      },
      {
        id: "inside-4",
        label: { en: "Partner Spas", fr: "Instituts Partenaires", ar: "المراكز الشريكة" },
        targetType: "page",
        url: "/partners",
        badge: { en: "UAE Clinics", fr: "Instituts & Spas EAU", ar: "عيادات الإمارات" },
        sortOrder: 4,
      },
      {
        id: "inside-5",
        label: {
          en: "Professionals & B2B",
          fr: "Professionnels & B2B",
          ar: "للمحترفين B2B",
        },
        targetType: "page",
        url: "/professionals",
        badge: {
          en: "Protocols & Cabin",
          fr: "Protocoles Cabine",
          ar: "بروتوكولات الصالونات",
        },
        sortOrder: 5,
      },
      {
        id: "inside-6",
        label: {
          en: "Book Appointment",
          fr: "Prendre Rendez-vous",
          ar: "حجز موعد",
        },
        targetType: "page",
        url: "/booking",
        badge: { en: "Diagnosis & Care", fr: "Diagnostic & Soin", ar: "تشخيص وعلاج" },
        sortOrder: 6,
      },
    ],
    megaMenuSections: [],
  },
];

@Injectable()
export class NavigationService {
  private readonly logger = new Logger(NavigationService.name);
  private publicNavigationCache: Record<string, { data: any; timestamp: number }> = {};
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

  constructor(
    @InjectModel(NavigationMenu.name)
    private readonly navModel: Model<NavigationMenuDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(SkinConcern.name)
    private readonly concernModel: Model<SkinConcernDocument>,
    @InjectModel(ProductRange.name)
    private readonly rangeModel: Model<ProductRangeDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name)
    private readonly variantModel: Model<ProductVariantDocument>,
    private readonly media: ProductMediaService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultNavigationIfEmpty();
  }

  async seedDefaultNavigationIfEmpty() {
    const published = await this.navModel.findOne({
      key: "main_header",
      status: "published",
    });
    if (!published) {
      this.logger.log("Seeding initial published NavigationMenu...");
      await this.navModel.create({
        key: "main_header",
        status: "published",
        version: 1,
        items: DEFAULT_HEADER_ITEMS,
        publishedAt: new Date(),
        publishedBy: "system_seed",
        updatedBy: "system_seed",
      });
    }

    const draft = await this.navModel.findOne({
      key: "main_header",
      status: "draft",
    });
    if (!draft) {
      await this.navModel.create({
        key: "main_header",
        status: "draft",
        version: 1,
        items: DEFAULT_HEADER_ITEMS,
        updatedBy: "system_seed",
      });
    }
  }

  /**
   * High-performance public navigation endpoint with resolved items, categories,
   * concerns, ranges, featured products, and AED pricing.
   */
  async getPublicNavigation(locale: "en" | "fr" | "ar" = "en") {
    const cacheKey = `public_nav_${locale}`;
    const cached = this.publicNavigationCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    let menu = await this.navModel
      .findOne({ key: "main_header", status: "published" })
      .lean();

    if (!menu || !menu.items || menu.items.length === 0) {
      await this.seedDefaultNavigationIfEmpty();
      menu = await this.navModel
        .findOne({ key: "main_header", status: "published" })
        .lean();
    }

    const items = menu?.items ?? DEFAULT_HEADER_ITEMS;

    // Concurrently fetch references to resolve dynamic mega menus & dropdowns
    const [categories, concerns, ranges, products, variants] = await Promise.all([
      this.categoryModel.find({ status: { $ne: "inactive" } }).lean(),
      this.concernModel.find({ status: { $ne: "inactive" } }).lean(),
      this.rangeModel.find({ status: { $ne: "inactive" } }).lean(),
      this.productModel
        .find({ status: "published", visibility: { $in: ["b2c", "both"] } })
        .lean(),
      this.variantModel.find().lean(),
    ]);

    const resolvedMedia = await this.media.resolve(products as any);
    const productMap = new Map<string, any>();
    products.forEach((p, idx) => {
      const pVariants = variants.filter(
        (v) => v.productId.toString() === p._id.toString(),
      );
      const minPrice = pVariants.length
        ? Math.min(...pVariants.map((v) => v.b2cPriceMinor))
        : 0;
      productMap.set(p.slug, {
        id: p._id,
        slug: p.slug,
        name: p.name,
        shortBenefit: p.shortBenefit,
        description: p.description,
        primaryImage: resolvedMedia[idx]?.primaryImage ?? null,
        image:
          resolvedMedia[idx]?.primaryImage?.url ??
          resolvedMedia[idx]?.images?.[0] ??
          p.images?.[0] ??
          null,
        priceFromMinor: minPrice,
        priceFormatted: minPrice > 0 ? `${(minPrice / 100).toFixed(0)} AED` : "",
        isBestSeller: p.isBestSeller ?? false,
      });
    });

    const categoryMap = new Map<string, any>();
    categories.forEach((c) => {
      categoryMap.set(c.slug, c);
    });

    const concernMap = new Map<string, any>();
    concerns.forEach((cn) => {
      concernMap.set(cn.slug, cn);
    });

    const rangeMap = new Map<string, any>();
    ranges.forEach((r) => {
      rangeMap.set(r.slug, r);
    });

    // Populate the navigation tree
    const populatedItems = items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => {
        const itemLabel = item.label?.[locale] || item.label?.en || item.slug;

        // Resolve Simple Dropdown items
        const resolvedDropdown = (item.simpleDropdownItems || []).map((drop) => {
          const dropLabel = drop.label?.[locale] || drop.label?.en;
          let productInfo: any = null;
          if (drop.targetType === "product" && drop.url) {
            const productSlug = drop.url.replace(/^\/shop\//, "");
            productInfo = productMap.get(productSlug) || null;
          }
          return {
            id: drop.id,
            label: dropLabel,
            labels: drop.label,
            targetType: drop.targetType,
            url: drop.url,
            badge: drop.badge?.[locale] || drop.badge?.en || null,
            sortOrder: drop.sortOrder,
            product: productInfo,
          };
        });

        // Resolve Mega Menu sections
        const resolvedSections = (item.megaMenuSections || []).map((sec) => {
          const secTitle = sec.title?.[locale] || sec.title?.en;
          let data: any = null;

          if (sec.type === "SKIN_CONCERNS") {
            const slugs = sec.config?.selectedSlugs || [
              "dehydration",
              "first-signs-of-aging",
              "fatigue-dullness",
              "sensitivity",
              "blemishes",
              "shine-control",
              "dark-spots",
              "menopause",
              "uv-protection",
            ];
            data = slugs
              .map((slug: string) => {
                const concernRecord = concernMap.get(slug);
                return {
                  slug,
                  label: concernRecord?.name?.[locale] || concernRecord?.name?.en || slug,
                  href: `/shop?concern=${slug}`,
                  icon: concernRecord?.icon || "sparkles",
                };
              })
              .filter(Boolean);
          } else if (sec.type === "PRODUCT_CATEGORIES") {
            const slugs = sec.config?.selectedSlugs || [
              "serums",
              "cremes",
              "nettoyants",
              "demaquillants",
              "masques",
              "soins-yeux-levres",
              "protection-solaire",
              "soins-sur-mesure",
            ];
            data = slugs
              .map((slug: string) => {
                const catRecord = categoryMap.get(slug);
                return {
                  slug,
                  label: catRecord?.name?.[locale] || catRecord?.name?.en || slug,
                  href: `/shop?category=${slug}`,
                };
              })
              .filter(Boolean);
          } else if (sec.type === "PRODUCT_RANGES") {
            const defaultRanges = [
              {
                key: "hydra",
                num: "1",
                name: "Hydra",
                color: PRODUCT_RANGE_COLORS.hydra,
                desc: "Hydratation durable",
              },
              {
                key: "energize",
                num: "2",
                name: "Energize",
                color: PRODUCT_RANGE_COLORS.energize,
                desc: "Éclat & Vitalité",
              },
              {
                key: "renew",
                num: "3",
                name: "Renew",
                color: PRODUCT_RANGE_COLORS.renew,
                desc: "Fermeté & Anti-âge",
              },
              {
                key: "calm",
                num: "4",
                name: "Calm",
                color: PRODUCT_RANGE_COLORS.calm,
                desc: "Apaisement & Anti-rougeurs",
              },
              {
                key: "purete",
                num: "5",
                name: "Pureté",
                color: PRODUCT_RANGE_COLORS.purete,
                desc: "Clarté & Anti-imperfections",
              },
              {
                key: "matte",
                num: "6",
                name: "Matte",
                color: PRODUCT_RANGE_COLORS.matte,
                desc: "Matité & Pores",
              },
              {
                key: "illumine",
                num: "7",
                name: "Illumine",
                color: PRODUCT_RANGE_COLORS.illumine,
                desc: "Taches & Éclat",
              },
            ];
            data = {
              includeBestSellers: sec.config?.includeBestSellers ?? true,
              ranges: defaultRanges.map((r) => {
                const rangeRecord = rangeMap.get(r.key);
                const rawName =
                  rangeRecord?.name?.[locale] || rangeRecord?.name?.en || r.name;
                const cleanName = rawName ? rawName.replace(/^\d+\s+/, "") : r.name;
                return {
                  key: r.key,
                  num: r.num,
                  name: cleanName,
                  color: rangeRecord?.color || r.color,
                  desc:
                    rangeRecord?.description?.[locale] ||
                    rangeRecord?.description?.en ||
                    r.desc,
                  href: `/shop?range=${r.key}`,
                };
              }),
            };
          } else if (sec.type === "FEATURED_PRODUCT") {
            const productSlug = sec.config?.productSlug || "creme-sublime-revitalisante";
            const productInfo = productMap.get(productSlug) || {
              slug: productSlug,
              name: {
                en: "Crème Sublime Revitalisante",
                fr: "Crème Sublime Revitalisante",
                ar: "كريم سوبليم",
              },
              image: "/images/products/creme-sublime-revitalisante-1.jpg",
              priceFormatted: "968 AED",
            };

            data = {
              product: productInfo,
              badge:
                sec.config?.badge?.[locale] || sec.config?.badge?.en || "Soin Iconique",
              headline:
                sec.config?.headlineOverride?.[locale] ||
                sec.config?.headlineOverride?.en ||
                productInfo?.name?.[locale] ||
                productInfo?.name?.en ||
                "Crème Sublime Revitalisante",
              description:
                sec.config?.descriptionOverride?.[locale] ||
                sec.config?.descriptionOverride?.en ||
                productInfo?.shortBenefit?.[locale] ||
                "Haute régénération cellulaire anti-âge aux actifs d'exception.",
              ctaLabel:
                sec.config?.ctaLabel?.[locale] ||
                sec.config?.ctaLabel?.en ||
                (locale === "fr"
                  ? "Découvrir tout"
                  : locale === "ar"
                    ? "اكتشفي المزيد"
                    : "Discover All"),
              href: `/shop/${productSlug}`,
              image:
                productInfo?.image ||
                "/images/products/creme-sublime-revitalisante-1.jpg",
              price: productInfo?.priceFormatted || "968 AED",
            };
          }

          return {
            id: sec.id,
            title: secTitle,
            type: sec.type,
            sortOrder: sec.sortOrder,
            visible: sec.visible,
            data,
            rawConfig: sec.config,
          };
        });

        return {
          id: item.id,
          slug: item.slug,
          label: itemLabel,
          labels: item.label,
          type: item.type,
          url: item.url,
          sortOrder: item.sortOrder,
          visibleDesktop: item.visibleDesktop,
          visibleMobile: item.visibleMobile,
          dropdownItems: resolvedDropdown,
          megaMenuSections: resolvedSections,
        };
      });

    const result = {
      version: menu?.version ?? 1,
      locale,
      items: populatedItems,
    };

    this.publicNavigationCache[cacheKey] = {
      data: result,
      timestamp: Date.now(),
    };

    return result;
  }

  /**
   * Get draft and published navigation configuration for Admin with health diagnostics.
   */
  async getAdminNavigation() {
    let [draft, published] = await Promise.all([
      this.navModel.findOne({ key: "main_header", status: "draft" }).lean(),
      this.navModel.findOne({ key: "main_header", status: "published" }).lean(),
    ]);

    if (!published) {
      await this.seedDefaultNavigationIfEmpty();
      published = await this.navModel
        .findOne({ key: "main_header", status: "published" })
        .lean();
    }

    if (!draft) {
      draft = await this.navModel.findOne({ key: "main_header", status: "draft" }).lean();
    }

    const health = await this.getNavigationHealth(draft?.items || DEFAULT_HEADER_ITEMS);

    return {
      draft: draft || {
        key: "main_header",
        status: "draft",
        version: 1,
        items: DEFAULT_HEADER_ITEMS,
      },
      published: published || {
        key: "main_header",
        status: "published",
        version: 1,
        items: DEFAULT_HEADER_ITEMS,
      },
      health,
    };
  }

  /**
   * Save draft navigation
   */
  async saveDraft(user: { email?: string; sub?: string }, items: NavigationItem[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException("Navigation items array is required.");
    }

    const updated = await this.navModel.findOneAndUpdate(
      { key: "main_header", status: "draft" },
      {
        $set: {
          items,
          updatedBy: user.email || user.sub || "admin",
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true },
    );

    return {
      success: true,
      draft: updated,
    };
  }

  /**
   * Publish draft navigation to live website
   */
  async publishNavigation(user: { email?: string; sub?: string }) {
    const draft = await this.navModel.findOne({
      key: "main_header",
      status: "draft",
    });

    if (!draft || !draft.items || draft.items.length === 0) {
      throw new BadRequestException("No draft navigation found to publish.");
    }

    const health = await this.getNavigationHealth(draft.items);
    if (!health.isValid) {
      throw new BadRequestException(
        `Cannot publish navigation: ${health.errors.join(", ")}`,
      );
    }

    const currentPublished = await this.navModel.findOne({
      key: "main_header",
      status: "published",
    });

    const nextVersion = (currentPublished?.version ?? 0) + 1;
    const now = new Date();

    const published = await this.navModel.findOneAndUpdate(
      { key: "main_header", status: "published" },
      {
        $set: {
          items: draft.items,
          version: nextVersion,
          publishedAt: now,
          publishedBy: user.email || user.sub || "admin",
          updatedBy: user.email || user.sub || "admin",
        },
      },
      { new: true, upsert: true },
    );

    // Invalidate public navigation cache
    this.invalidateCache();
    this.logger.log(`Navigation published v${nextVersion} by ${user.email}`);

    return {
      success: true,
      version: nextVersion,
      publishedAt: now,
      published,
    };
  }

  /**
   * Invalidate in-memory caches
   */
  invalidateCache() {
    this.publicNavigationCache = {};
  }

  /**
   * Navigation Health Diagnostics
   */
  async getNavigationHealth(
    items: NavigationItem[],
  ): Promise<NavigationHealthDiagnostic> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!items || items.length === 0) {
      errors.push("Header navigation has 0 items.");
    }

    let missingEn = false;
    let missingFr = false;
    let missingArCount = 0;

    const [categories, products] = await Promise.all([
      this.categoryModel.find().lean(),
      this.productModel
        .find({ status: "published", visibility: { $in: ["b2c", "both"] } })
        .lean(),
    ]);

    const activeProductIds = new Set(products.map((p) => p._id.toString()));
    const productSlugs = new Set(products.map((p) => p.slug));

    // Category product counts
    const categoryCountMap = new Map<string, number>();
    categories.forEach((cat) => {
      const count = products.filter((p) =>
        (p.categoryIds || []).some((id) => id.toString() === cat._id.toString()),
      ).length;
      categoryCountMap.set(cat.slug, count);
    });

    const emptyCategories: { slug: string; name: string }[] = [];
    const missingProducts: string[] = [];

    items.forEach((item) => {
      if (!item.label?.en?.trim()) missingEn = true;
      if (!item.label?.fr?.trim()) missingFr = true;
      if (!item.label?.ar?.trim()) missingArCount++;

      // Check category links
      if (item.url?.includes("category=")) {
        const match = item.url.match(/category=([a-z0-9-]+)/);
        if (match && match[1]) {
          const count = categoryCountMap.get(match[1]) ?? 0;
          if (count === 0) {
            const cat = categories.find((c) => c.slug === match[1]);
            emptyCategories.push({ slug: match[1], name: cat?.name?.en || match[1] });
          }
        }
      }

      // Check simple dropdown products
      (item.simpleDropdownItems || []).forEach((drop) => {
        if (!drop.label?.ar?.trim()) missingArCount++;
        if (drop.targetType === "product" && drop.url) {
          const slug = drop.url.replace(/^\/shop\//, "");
          if (!productSlugs.has(slug)) {
            missingProducts.push(slug);
          }
        }
      });

      // Check mega menu sections
      (item.megaMenuSections || []).forEach((sec) => {
        if (!sec.title?.ar?.trim()) missingArCount++;
        if (sec.type === "FEATURED_PRODUCT" && sec.config?.productSlug) {
          if (!productSlugs.has(sec.config.productSlug)) {
            missingProducts.push(sec.config.productSlug);
          }
        }
        if (
          sec.type === "PRODUCT_CATEGORIES" &&
          Array.isArray(sec.config?.selectedSlugs)
        ) {
          sec.config.selectedSlugs.forEach((slug: string) => {
            const count = categoryCountMap.get(slug) ?? 0;
            if (count === 0) {
              const cat = categories.find((c) => c.slug === slug);
              emptyCategories.push({ slug, name: cat?.name?.en || slug });
            }
          });
        }
      });
    });

    if (missingEn) errors.push("Missing English labels in navigation.");
    if (missingFr) errors.push("Missing French labels in navigation.");
    if (missingArCount > 0) {
      warnings.push(`${missingArCount} item(s) are missing Arabic translations.`);
    }
    if (emptyCategories.length > 0) {
      warnings.push(
        `${emptyCategories.length} category destination(s) have 0 active UAE products.`,
      );
    }
    if (missingProducts.length > 0) {
      warnings.push(
        `Referenced product(s) not found or inactive: ${missingProducts.join(", ")}`,
      );
    }

    return {
      isValid: errors.length === 0,
      itemCount: items.length,
      warnings,
      errors,
      translations: {
        en: !missingEn,
        fr: !missingFr,
        ar: missingArCount === 0,
        missingArCount,
      },
      emptyCategories,
      missingProducts,
    };
  }

  /**
   * Get Hierarchical Category Tree with product counts and ancestry depth
   */
  async getCategoryTree() {
    const [categories, products] = await Promise.all([
      this.categoryModel.find().sort({ sortOrder: 1, "name.en": 1 }).lean(),
      this.productModel.find({ status: { $ne: "archived" } }, { categoryIds: 1 }).lean(),
    ]);

    const countMap = new Map<string, number>();
    products.forEach((p) => {
      (p.categoryIds || []).forEach((id) => {
        const key = id.toString();
        countMap.set(key, (countMap.get(key) || 0) + 1);
      });
    });

    // Build tree
    const categoryMap = new Map<string, any>();
    categories.forEach((cat) => {
      categoryMap.set(cat._id.toString(), {
        ...cat,
        id: cat._id.toString(),
        productCount: countMap.get(cat._id.toString()) || 0,
        children: [],
      });
    });

    const rootCategories: any[] = [];
    categoryMap.forEach((node) => {
      if (node.parentId && categoryMap.has(node.parentId.toString())) {
        categoryMap.get(node.parentId.toString()).children.push(node);
      } else {
        rootCategories.push(node);
      }
    });

    return rootCategories;
  }

  /**
   * Circular hierarchy prevention guard:
   * Returns true if valid, throws BadRequestException if circular reference detected.
   */
  async validateCategoryParent(categoryId: string | null, newParentId: string | null) {
    if (!categoryId || !newParentId) return true;
    if (categoryId === newParentId) {
      throw new BadRequestException("A category cannot be its own parent.");
    }

    // Traverse ancestors of newParentId upwards
    let currentParentId: string | null = newParentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (currentParentId === categoryId) {
        throw new BadRequestException(
          "Circular hierarchy detected: cannot set a child or descendant as parent.",
        );
      }
      if (visited.has(currentParentId)) break;
      visited.add(currentParentId);

      const parentDoc: { parentId?: Types.ObjectId | null } | null =
        await this.categoryModel.findById(currentParentId, { parentId: 1 }).lean();
      currentParentId = parentDoc?.parentId ? parentDoc.parentId.toString() : null;
    }

    return true;
  }
}
