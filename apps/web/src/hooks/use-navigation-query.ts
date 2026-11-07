import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { apiFetch } from "@/lib/api";
import { PRODUCT_RANGE_COLORS } from "@ioma/config";

export interface ResolvedDropdownItem {
  id: string;
  label: string;
  labels: { en: string; fr: string; ar: string };
  targetType: "product" | "category" | "page" | "custom";
  url: string;
  badge?: string | null;
  sortOrder: number;
  product?: {
    id?: string;
    slug: string;
    name: { en: string; fr: string; ar: string };
    shortBenefit?: { en: string; fr: string; ar: string };
    image?: string | null;
    primaryImage?: any;
    priceFormatted: string;
  } | null;
}

export interface ResolvedConcernItem {
  slug: string;
  label: string;
  href: string;
  icon: string;
}

export interface ResolvedCategoryItem {
  slug: string;
  label: string;
  href: string;
}

export interface ResolvedRangeItem {
  key: string;
  num: string | number;
  name: string;
  color: string;
  desc: string;
  href: string;
}

export interface ResolvedFeaturedProduct {
  product: {
    id?: string;
    slug: string;
    name: { en: string; fr: string; ar: string };
    shortBenefit?: { en: string; fr: string; ar: string };
    image?: string | null;
    priceFormatted: string;
  };
  badge: string;
  headline: string;
  description: string;
  ctaLabel: string;
  href: string;
  image: string;
  price: string;
}

export interface ResolvedMegaMenuSection {
  id: string;
  title: string;
  type:
    | "SKIN_CONCERNS"
    | "PRODUCT_CATEGORIES"
    | "PRODUCT_RANGES"
    | "MANUAL_LINKS"
    | "FEATURED_PRODUCT"
    | "FEATURED_IMAGE"
    | "CMS_CONTENT";
  sortOrder: number;
  visible: boolean;
  data: any;
  rawConfig?: Record<string, any>;
}

export interface ResolvedNavigationItem {
  id: string;
  slug: string;
  label: string;
  labels: { en: string; fr: string; ar: string };
  type: "DIRECT_LINK" | "SIMPLE_DROPDOWN" | "MEGA_MENU" | "CMS_LINK";
  url: string;
  sortOrder: number;
  visibleDesktop: boolean;
  visibleMobile: boolean;
  dropdownItems?: ResolvedDropdownItem[];
  megaMenuSections?: ResolvedMegaMenuSection[];
}

export interface PublicNavigationPayload {
  version: number;
  locale: string;
  items: ResolvedNavigationItem[];
}

export const FALLBACK_NAVIGATION: Record<string, PublicNavigationPayload> = {
  en: {
    version: 1,
    locale: "en",
    items: [
      {
        id: "nav-uv-protection",
        slug: "uv-protection",
        label: "UV & Protection",
        labels: { en: "UV & Protection", fr: "UV & Protection", ar: "الحماية من الشمس" },
        type: "DIRECT_LINK",
        url: "/shop?category=protection-solaire",
        sortOrder: 1,
        visibleDesktop: true,
        visibleMobile: true,
      },
      {
        id: "nav-bespoke",
        slug: "soins-sur-mesure",
        label: "Bespoke Skincare",
        labels: { en: "Bespoke Skincare", fr: "Soins Sur Mesure", ar: "عناية مخصصة" },
        type: "SIMPLE_DROPDOWN",
        url: "/shop?category=soins-sur-mesure",
        sortOrder: 2,
        visibleDesktop: true,
        visibleMobile: true,
        dropdownItems: [
          {
            id: "bespoke-1",
            label: "Ma Crème Jour",
            labels: {
              en: "Ma Crème Jour",
              fr: "Ma Crème Jour",
              ar: "كريم النهار المخصص",
            },
            targetType: "product",
            url: "/shop/ma-creme-jour",
            badge: "30ml / 50ml",
            sortOrder: 1,
            product: {
              slug: "ma-creme-jour",
              name: {
                en: "Ma Crème Jour",
                fr: "Ma Crème Jour",
                ar: "كريم النهار المخصص",
              },
              image: "/images/products/ma-creme-jour-1.jpg",
              priceFormatted: "From 559 AED",
            },
          },
          {
            id: "bespoke-2",
            label: "Ma Crème Nuit",
            labels: { en: "Ma Crème Nuit", fr: "Ma Crème Nuit", ar: "كريم الليل المخصص" },
            targetType: "product",
            url: "/shop/ma-creme-nuit",
            badge: "30ml / 50ml",
            sortOrder: 2,
            product: {
              slug: "ma-creme-nuit",
              name: { en: "Ma Crème Nuit", fr: "Ma Crème Nuit", ar: "كريم الليل المخصص" },
              image: "/images/products/ma-creme-nuit-1.jpg",
              priceFormatted: "From 559 AED",
            },
          },
          {
            id: "bespoke-3",
            label: "Mon Sérum",
            labels: { en: "Mon Sérum", fr: "Mon Sérum", ar: "سيروم مخصص" },
            targetType: "product",
            url: "/shop/mon-serum",
            badge: "30ml",
            sortOrder: 3,
            product: {
              slug: "mon-serum",
              name: { en: "Mon Sérum", fr: "Mon Sérum", ar: "سيروم مخصص" },
              image: "/images/products/mon-serum-1.jpg",
              priceFormatted: "873 AED",
            },
          },
          {
            id: "bespoke-4",
            label: "Mon Soin Yeux",
            labels: {
              en: "Mon Soin Yeux",
              fr: "Mon Soin Yeux",
              ar: "عناية العيون المخصصة",
            },
            targetType: "product",
            url: "/shop/mon-soin-yeux",
            badge: "30ml",
            sortOrder: 4,
            product: {
              slug: "mon-soin-yeux",
              name: {
                en: "Mon Soin Yeux",
                fr: "Mon Soin Yeux",
                ar: "عناية العيون المخصصة",
              },
              image: "/images/products/mon-soin-yeux-1.jpg",
              priceFormatted: "508 AED",
            },
          },
        ],
      },
      {
        id: "nav-visage",
        slug: "visage",
        label: "Face",
        labels: { en: "Face", fr: "Visage", ar: "الوجه" },
        type: "MEGA_MENU",
        url: "/shop",
        sortOrder: 3,
        visibleDesktop: true,
        visibleMobile: true,
        megaMenuSections: [
          {
            id: "sec-concerns",
            title: "Your Concerns",
            type: "SKIN_CONCERNS",
            sortOrder: 1,
            visible: true,
            data: [
              {
                slug: "dehydration",
                label: "Dehydration",
                href: "/shop?concern=dehydration",
                icon: "droplet",
              },
              {
                slug: "first-signs-of-aging",
                label: "First Signs of Aging",
                href: "/shop?concern=first-signs-of-aging",
                icon: "sparkles",
              },
              {
                slug: "fatigue-dullness",
                label: "Fatigue & Dullness",
                href: "/shop?concern=fatigue-dullness",
                icon: "sun",
              },
              {
                slug: "sensitivity",
                label: "Sensitivity & Redness",
                href: "/shop?concern=sensitivity",
                icon: "leaf",
              },
              {
                slug: "blemishes",
                label: "Blemishes & Pores",
                href: "/shop?concern=blemishes",
                icon: "shield",
              },
              {
                slug: "shine-control",
                label: "Shine Control",
                href: "/shop?concern=shine-control",
                icon: "wind",
              },
              {
                slug: "dark-spots",
                label: "Dark Spots & Even Tone",
                href: "/shop?concern=dark-spots",
                icon: "circle-dot",
              },
              {
                slug: "menopause",
                label: "Menopause & Density",
                href: "/shop?concern=menopause",
                icon: "sparkles",
              },
              {
                slug: "uv-protection",
                label: "UV Protection",
                href: "/shop?concern=uv-protection",
                icon: "sun",
              },
            ],
          },
          {
            id: "sec-categories",
            title: "Our Categories",
            type: "PRODUCT_CATEGORIES",
            sortOrder: 2,
            visible: true,
            data: [
              { slug: "serums", label: "Serums", href: "/shop?category=serums" },
              {
                slug: "cremes",
                label: "Day & Night Creams",
                href: "/shop?category=cremes",
              },
              {
                slug: "nettoyants",
                label: "Cleansers & Toners",
                href: "/shop?category=nettoyants",
              },
              {
                slug: "demaquillants",
                label: "Makeup Removers",
                href: "/shop?category=demaquillants",
              },
              {
                slug: "masques",
                label: "Masks & Scrubs",
                href: "/shop?category=masques",
              },
              {
                slug: "soins-yeux-levres",
                label: "Eye & Lip Care",
                href: "/shop?category=soins-yeux-levres",
              },
              {
                slug: "protection-solaire",
                label: "UV Protection",
                href: "/shop?category=protection-solaire",
              },
              {
                slug: "soins-sur-mesure",
                label: "Bespoke In.Lab Care",
                href: "/shop?category=soins-sur-mesure",
              },
            ],
          },
          {
            id: "sec-ranges",
            title: "Our Ranges",
            type: "PRODUCT_RANGES",
            sortOrder: 3,
            visible: true,
            data: {
              includeBestSellers: true,
              ranges: [
                {
                  key: "hydra",
                  num: "1",
                  name: "Hydra",
                  color: PRODUCT_RANGE_COLORS.hydra,
                  desc: "Lasting hydration",
                  href: "/shop?range=hydra",
                },
                {
                  key: "energize",
                  num: "2",
                  name: "Energize",
                  color: PRODUCT_RANGE_COLORS.energize,
                  desc: "Radiance & Vitality",
                  href: "/shop?range=energize",
                },
                {
                  key: "renew",
                  num: "3",
                  name: "Renew",
                  color: PRODUCT_RANGE_COLORS.renew,
                  desc: "Firmness & Anti-aging",
                  href: "/shop?range=renew",
                },
                {
                  key: "calm",
                  num: "4",
                  name: "Calm",
                  color: PRODUCT_RANGE_COLORS.calm,
                  desc: "Soothing & Anti-redness",
                  href: "/shop?range=calm",
                },
                {
                  key: "purete",
                  num: "5",
                  name: "Pureté",
                  color: PRODUCT_RANGE_COLORS.purete,
                  desc: "Clarity & Anti-blemish",
                  href: "/shop?range=purete",
                },
                {
                  key: "matte",
                  num: "6",
                  name: "Matte",
                  color: PRODUCT_RANGE_COLORS.matte,
                  desc: "Mattifying & Pores",
                  href: "/shop?range=matte",
                },
                {
                  key: "illumine",
                  num: "7",
                  name: "Illumine",
                  color: PRODUCT_RANGE_COLORS.illumine,
                  desc: "Dark spots & Radiance",
                  href: "/shop?range=illumine",
                },
              ],
            },
          },
          {
            id: "sec-featured",
            title: "Featured Product",
            type: "FEATURED_PRODUCT",
            sortOrder: 4,
            visible: true,
            data: {
              product: {
                slug: "creme-sublime-revitalisante",
                name: {
                  en: "Crème Sublime Revitalisante",
                  fr: "Crème Sublime Revitalisante",
                  ar: "كريم سوبليم لتجديد الحيوية",
                },
                image: "/images/products/creme-sublime-revitalisante-1.jpg",
                priceFormatted: "968 AED",
              },
              badge: "Iconic Skincare",
              headline: "Crème Sublime Revitalisante",
              description:
                "High cellular anti-aging regeneration with exceptional active ingredients.",
              ctaLabel: "Discover All",
              href: "/shop/creme-sublime-revitalisante",
              image: "/images/products/creme-sublime-revitalisante-1.jpg",
              price: "968 AED",
            },
          },
        ],
      },
      {
        id: "nav-corps",
        slug: "corps",
        label: "Body",
        labels: { en: "Body", fr: "Corps", ar: "الجسم" },
        type: "DIRECT_LINK",
        url: "/shop?category=corps",
        sortOrder: 4,
        visibleDesktop: true,
        visibleMobile: true,
      },
      {
        id: "nav-cheveux",
        slug: "cheveux",
        label: "Hair",
        labels: { en: "Hair", fr: "Cheveux", ar: "الشعر" },
        type: "DIRECT_LINK",
        url: "/shop?category=cheveux",
        sortOrder: 5,
        visibleDesktop: true,
        visibleMobile: true,
      },
      {
        id: "nav-routines",
        slug: "routines",
        label: "Kits & Routines",
        labels: { en: "Kits & Routines", fr: "Kits & Routines", ar: "مجموعات وروتين" },
        type: "DIRECT_LINK",
        url: "/shop?category=routines",
        sortOrder: 6,
        visibleDesktop: true,
        visibleMobile: true,
      },
      {
        id: "nav-inside",
        slug: "inside-ioma",
        label: "Inside IOMA",
        labels: { en: "Inside IOMA", fr: "Inside IOMA", ar: "داخل آيوما" },
        type: "SIMPLE_DROPDOWN",
        url: "/about",
        sortOrder: 7,
        visibleDesktop: true,
        visibleMobile: true,
        dropdownItems: [
          {
            id: "in-1",
            label: "About",
            labels: { en: "About", fr: "About", ar: "من نحن" },
            targetType: "page",
            url: "/about",
            sortOrder: 1,
          },
          {
            id: "in-2",
            label: "Technology",
            labels: { en: "Technology", fr: "Technology", ar: "التكنولوجيا" },
            targetType: "page",
            url: "/technology",
            sortOrder: 2,
          },
          {
            id: "in-3",
            label: "Journal",
            labels: { en: "Journal", fr: "Journal", ar: "المجلة" },
            targetType: "page",
            url: "/journal",
            sortOrder: 3,
          },
          {
            id: "in-4",
            label: "Partner Clinics",
            labels: {
              en: "Partner Clinics",
              fr: "Instituts Partenaires",
              ar: "المراكز الشريكة",
            },
            targetType: "page",
            url: "/partners",
            sortOrder: 4,
          },
          {
            id: "in-5",
            label: "Professionals & B2B",
            labels: {
              en: "Professionals & B2B",
              fr: "Professionnels & B2B",
              ar: "للمحترفين",
            },
            targetType: "page",
            url: "/professionals",
            sortOrder: 5,
          },
          {
            id: "in-6",
            label: "Book Appointment",
            labels: { en: "Book Appointment", fr: "Prendre Rendez-vous", ar: "حجز موعد" },
            targetType: "page",
            url: "/booking",
            sortOrder: 6,
          },
        ],
      },
    ],
  },
};

export function usePublicNavigation() {
  const locale = useLocale();
  const validLocale = ["en", "ar"].includes(locale) ? locale : "en";
  const fallback = FALLBACK_NAVIGATION[validLocale] || FALLBACK_NAVIGATION.en!;

  const query = useQuery({
    queryKey: ["navigation", "public", validLocale],
    queryFn: () =>
      apiFetch<PublicNavigationPayload>(`/navigation/public?locale=${validLocale}`),
    staleTime: 60 * 1000,
    retry: 1,
    placeholderData: fallback,
  });

  // placeholderData only covers the loading state. If the request fails (API down, slow, or the route missing) the
  // query has no data at all, which used to leave the header without its link row. The built-in menu always shows.
  const data = query.data?.items?.length ? query.data : fallback;
  return { ...query, data };
}
