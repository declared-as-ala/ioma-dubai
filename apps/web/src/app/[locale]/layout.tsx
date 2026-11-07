import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { isRtl, type Locale } from "@ioma/config";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QueryProvider } from "@/components/providers/query-provider";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { RouteProgressBar } from "@/components/motion/route-progress-bar";
import { PageTransition } from "@/components/motion/page-transition";
import { ToastContainer } from "@/components/ui/toast";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { BottomTabBarSpacer } from "@/components/layout/bottom-tab-bar-spacer";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { StorefrontChrome } from "@/components/layout/storefront-chrome";
import { CompareBar } from "@/components/shop/compare-bar";
import { ManagedPage } from "@/components/content/managed-content";
import { ConsentManager } from "@/components/consent/consent-manager";
import "../globals.css";

// Official brand fonts supplied by IOMA (IOMA_Identite-de-marque-2026-2027/POLICES): Gotham is the primary
// institutional face, Futura the secondary one. Futura ships here as Medium (also used for the regular
// weight) and Bold. The CSS variable names are kept so existing styles pick the real fonts up unchanged.
// Cairo covers the `ar` locale: the charter specifies no Arabic typeface, so a geometric Arabic sans that
// pairs visually with Gotham/Futura was chosen deliberately.
const manrope = localFont({
  src: [
    { path: "../../fonts/Gotham-Light.otf", weight: "300", style: "normal" },
    { path: "../../fonts/Gotham-Book.otf", weight: "400", style: "normal" },
    { path: "../../fonts/Gotham-Medium.otf", weight: "500", style: "normal" },
    { path: "../../fonts/Gotham-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
});
const jost = localFont({
  src: [
    { path: "../../fonts/Futura-Medium.ttf", weight: "300", style: "normal" },
    { path: "../../fonts/Futura-Medium.ttf", weight: "400", style: "normal" },
    { path: "../../fonts/Futura-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../fonts/Futura-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-jost",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IOMA Paris | Dubai",
  description:
    "IOMA Paris — N°1 de la Cosmétique Personnalisée. The official IOMA Paris digital flagship for Dubai and the UAE.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const dir = isRtl(locale as Locale) ? "rtl" : "ltr";

  return (
    <html
      suppressHydrationWarning // /technology flags <html> with `tx-js` before React hydrates
      lang={locale}
      dir={dir}
      className={`${manrope.variable} ${jost.variable} ${cairo.variable} ${inter.variable}`}
    >
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <OrganizationJsonLd />
            <RouteProgressBar />
            <StorefrontChrome>
              <Header />
            </StorefrontChrome>
            <PageTransition>
              <ManagedPage>{children}</ManagedPage>
            </PageTransition>
            <StorefrontChrome>
              <Footer />
              <BottomTabBarSpacer />
              <CartDrawer />
              <CompareBar />
            </StorefrontChrome>
            <ToastContainer />
            <ConsentManager />
            <StorefrontChrome>
              <BottomTabBar />
            </StorefrontChrome>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// Skipped in `next dev`: on Windows the dev server races on .next/prerender-manifest.json when
// this runs, which corrupts it and 500s every page. Production builds still prerender locales.
export const generateStaticParams =
  process.env.NODE_ENV === "production"
    ? () => routing.locales.map((locale) => ({ locale }))
    : undefined;
