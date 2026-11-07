"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Search, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { CartTriggerButton } from "@/components/shop/cart-trigger-button";
import { AccountLink } from "@/components/layout/account-link";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { SearchDrawer } from "@/components/shop/search-drawer";
import { Button } from "@/components/ui/button";
import { useSearchStore } from "@/stores/search-store";
import { MegaMenu } from "@/components/layout/mega-menu";
import { SoinsSurMesureDropdown } from "@/components/layout/soins-sur-mesure-dropdown";
import { InsideIomaDropdown } from "@/components/layout/inside-ioma-dropdown";
import { usePublicNavigation } from "@/hooks/use-navigation-query";

export function Header() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const openSearch = useSearchStore((state) => state.openSearch);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>("none");
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: navData } = usePublicNavigation();
  const navItems = navData?.items || [];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard escape listener to close any open mega-menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu("none");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMouseEnter = (menuSlug: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveMenu(menuSlug);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveMenu("none");
    }, 150);
  };

  const handleMenuClick = (menuSlug: string) => {
    setActiveMenu((prev) => (prev === menuSlug ? "none" : menuSlug));
  };

  const isHomepage =
    pathname === "/" ||
    pathname === "/en" ||
    pathname === "/fr" ||
    pathname === "/ar" ||
    pathname === "" ||
    pathname === "/en/" ||
    pathname === "/fr/" ||
    pathname === "/ar/";

  // On the homepage the bar is transparent over the hero (light text) and turns solid once the page scrolls
  // or a menu opens, so the logo and links always stay readable and above the hero video.
  const overHero = isHomepage && !isScrolled && activeMenu === "none";
  const isDarkHeader = overHero;

  const activeItem = navItems.find((i) => i.slug === activeMenu || i.id === activeMenu);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-30 transition-[background-color,color,border-color,box-shadow] duration-300 ${
          isDarkHeader
            ? "border-b border-transparent bg-gradient-to-b from-black/60 via-black/25 to-transparent text-ioma-white"
            : `border-b border-border bg-background/95 text-foreground backdrop-blur-md ${
                isScrolled ? "shadow-md" : ""
              }`
        }`}
        onMouseLeave={handleMouseLeave}
      >
        {/* Utility bar */}
        <div
          className={`border-b transition-colors duration-300 ${
            isDarkHeader
              ? "border-ioma-white/10 bg-transparent text-ioma-white/80"
              : "border-border bg-muted/20 text-muted-foreground"
          }`}
        >
          <div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-between px-4 text-[0.65rem] uppercase tracking-widest md:px-6">
            <div className="flex items-center gap-4">
              <span>
                {t("region")} — {t("currency")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/partners"
                className={`hidden md:inline-flex text-[0.65rem] uppercase tracking-wider transition-colors ${
                  isDarkHeader
                    ? "text-ioma-white/70 hover:text-ioma-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("partners")}
              </Link>
              <span
                className={
                  isDarkHeader
                    ? "hidden md:inline text-ioma-white/20"
                    : "hidden md:inline text-border"
                }
              >
                |
              </span>
              <Link
                href="/professionals"
                className={`hidden md:inline-flex text-[0.65rem] uppercase tracking-wider transition-colors ${
                  isDarkHeader
                    ? "text-ioma-white/70 hover:text-ioma-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("professionals")}
              </Link>
              <span
                className={
                  isDarkHeader
                    ? "hidden md:inline text-ioma-white/20"
                    : "hidden md:inline text-border"
                }
              >
                |
              </span>
              <LocaleSwitcher />
            </div>
          </div>
        </div>

        {/* Logo row */}
        <div className="relative mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <MobileNavigation />
          </div>

          <Link
            href="/"
            aria-label={t("home")}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          >
            <span className="flex items-center gap-6 xl:gap-10" dir="ltr">
              <Image
                src={
                  overHero ? "/images/burj-emblem-white.png" : "/images/burj-emblem.png"
                }
                alt=""
                width={516}
                height={1184}
                priority
                className="h-[52px] w-auto xl:h-[62px]"
              />
              <Image
                src={
                  overHero
                    ? "/images/brand/logo-white.svg"
                    : "/images/brand/logo-black.svg"
                }
                alt="IOMA Paris"
                width={2020}
                height={856}
                priority
                className="h-auto w-[102px] xl:w-[138px]"
              />
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("search")}
              data-testid="search-trigger"
              onClick={openSearch}
              className={`inline-flex transition-colors ${
                isDarkHeader
                  ? "text-ioma-white hover:bg-ioma-white/10 hover:text-ioma-white"
                  : "hover:bg-muted"
              }`}
            >
              <Search className="size-4" />
            </Button>
            <AccountLink />
            <CartTriggerButton />

            <Button
              asChild
              size="sm"
              className={`ms-2 hidden uppercase tracking-widest xl:inline-flex font-semibold bg-primary hover:bg-primary/90 text-primary-foreground`}
            >
              <Link href="/partners" prefetch={false}>
                {t("findPartner")}
              </Link>
            </Button>
          </div>
        </div>

        {/* Primary nav dynamically generated from Admin Configuration */}
        <nav
          aria-label={t("primaryNavigation")}
          className={`mx-auto hidden max-w-[1440px] items-center justify-center gap-8 overflow-visible px-4 py-2.5 md:px-6 xl:flex`}
        >
          {navItems.map((item) => {
            const isMenuType =
              item.type === "MEGA_MENU" || item.type === "SIMPLE_DROPDOWN";
            const isActive = activeMenu === item.slug || activeMenu === item.id;

            if (!isMenuType) {
              return (
                <Link
                  key={item.id}
                  href={item.url || "/shop"}
                  className={`text-xs uppercase tracking-widest font-medium transition-colors ${
                    isDarkHeader
                      ? pathname === item.url || (item.url && pathname.includes(item.url))
                        ? "text-ioma-white font-semibold"
                        : "text-ioma-white/75 hover:text-ioma-white"
                      : pathname === item.url || (item.url && pathname.includes(item.url))
                        ? "text-foreground font-semibold"
                        : "text-foreground/80 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.slug)}
              >
                <button
                  type="button"
                  onClick={() => handleMenuClick(item.slug)}
                  aria-expanded={isActive}
                  aria-haspopup="true"
                  className={`flex items-center gap-1 text-xs uppercase tracking-widest font-medium transition-colors ${
                    isDarkHeader
                      ? isActive
                        ? "text-ioma-white font-semibold"
                        : "text-ioma-white/75 hover:text-ioma-white"
                      : isActive
                        ? "text-foreground font-semibold"
                        : "text-foreground/80 hover:text-foreground"
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    className={`size-3 transition-transform duration-200 ${
                      isActive ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </nav>

        {/* Dropdowns & Mega Menus */}
        <MegaMenu
          isOpen={activeItem?.type === "MEGA_MENU" || activeMenu === "visage"}
          onClose={() => setActiveMenu("none")}
          item={activeItem?.type === "MEGA_MENU" ? activeItem : null}
        />

        <SoinsSurMesureDropdown
          isOpen={
            (activeItem?.type === "SIMPLE_DROPDOWN" &&
              (activeItem.slug.includes("sur-mesure") ||
                activeItem.slug.includes("bespoke"))) ||
            activeMenu === "bespoke"
          }
          onClose={() => setActiveMenu("none")}
          item={activeItem?.type === "SIMPLE_DROPDOWN" ? activeItem : null}
        />

        <InsideIomaDropdown
          isOpen={
            (activeItem?.type === "SIMPLE_DROPDOWN" &&
              activeItem.slug.includes("inside")) ||
            activeMenu === "inside"
          }
          onClose={() => setActiveMenu("none")}
        />

        {/* Search Drawer Modal */}
        <SearchDrawer />
      </header>

      {/* Fixed Header Layout Spacer — suppressed on homepage to allow full-bleed Hero */}
      {!isHomepage && (
        <div className="h-[120px] xl:h-[148px] w-full shrink-0" aria-hidden="true" />
      )}
    </>
  );
}
