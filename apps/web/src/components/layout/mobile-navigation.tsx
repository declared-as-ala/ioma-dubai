"use client";

import { useState } from "react";
import { Menu, ChevronRight, ChevronLeft } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PRODUCT_RANGE_COLORS } from "@ioma/config";
import {
  usePublicNavigation,
  type ResolvedNavigationItem,
} from "@/hooks/use-navigation-query";

export function MobileNavigation({ showOnDesktop = false }: { showOnDesktop?: boolean }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const [screen, setScreen] = useState<string>("root");

  const { data: navData } = usePublicNavigation();
  const navItems = navData?.items || [];

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => setScreen("root"), 250);
    }
  };

  const activeSubmenuItem = navItems.find((i) => i.id === screen || i.slug === screen);

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={showOnDesktop ? undefined : "xl:hidden"}
          aria-label={t("openMenu")}
          data-testid="mobile-nav-trigger"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={locale === "ar" ? "right" : "left"}
        className="w-full max-w-sm p-0 flex flex-col bg-sf-pearl"
        showCloseButton={true}
        data-testid="mobile-nav"
      >
        <SheetHeader className="p-4 border-b border-border text-start">
          <SheetTitle className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            {screen === "root" ? (
              t("primaryNavigation")
            ) : (
              <button
                type="button"
                onClick={() => setScreen("root")}
                className="flex items-center gap-1.5 text-foreground hover:text-sf-champagne transition-colors"
              >
                <ChevronLeft className="size-4 rtl:rotate-180" />
                <span>{t("back")}</span>
              </button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {/* ROOT SCREEN */}
          {screen === "root" && (
            <nav className="flex flex-col space-y-1" aria-label={t("primaryNavigation")}>
              {navItems.map((item) => {
                const hasSubmenu =
                  item.type === "MEGA_MENU" || item.type === "SIMPLE_DROPDOWN";

                if (!hasSubmenu) {
                  return (
                    <SheetClose asChild key={item.id}>
                      <Link
                        href={item.url || "/shop"}
                        className="flex min-h-14 items-center justify-between border-b border-border/60 px-2 font-display text-2xl font-medium tracking-[-0.01em] rtl:tracking-normal text-foreground hover:text-sf-champagne transition-colors"
                      >
                        <span>{item.label}</span>
                      </Link>
                    </SheetClose>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScreen(item.id)}
                    className="flex min-h-14 w-full items-center justify-between border-b border-border/60 px-2 font-display text-2xl font-medium tracking-[-0.01em] rtl:tracking-normal text-foreground hover:text-sf-champagne transition-colors text-start"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
                  </button>
                );
              })}

              {/* Partner locator quick CTA */}
              <div className="pt-6 space-y-3">
                <SheetClose asChild>
                  <Link
                    href="/partners"
                    className="flex min-h-[44px] items-center justify-center rounded-sm border border-border px-4 text-xs uppercase tracking-widest font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    {t("findPartner")}
                  </Link>
                </SheetClose>
              </div>
            </nav>
          )}

          {/* SUBMENU SCREEN FOR MEGA MENU */}
          {screen !== "root" && activeSubmenuItem?.type === "MEGA_MENU" && (
            <div className="space-y-6">
              {/* Render dynamic mega menu sections */}
              {activeSubmenuItem.megaMenuSections?.map((sec) => {
                if (sec.type === "PRODUCT_RANGES") {
                  const rangesList = Array.isArray(sec.data?.ranges)
                    ? sec.data.ranges
                    : [
                        {
                          key: "hydra",
                          num: "1",
                          name: "Hydra",
                          color: PRODUCT_RANGE_COLORS.hydra,
                        },
                        {
                          key: "energize",
                          num: "2",
                          name: "Energize",
                          color: PRODUCT_RANGE_COLORS.energize,
                        },
                        {
                          key: "renew",
                          num: "3",
                          name: "Renew",
                          color: PRODUCT_RANGE_COLORS.renew,
                        },
                        {
                          key: "calm",
                          num: "4",
                          name: "Calm",
                          color: PRODUCT_RANGE_COLORS.calm,
                        },
                        {
                          key: "purete",
                          num: "5",
                          name: "Pureté",
                          color: PRODUCT_RANGE_COLORS.purete,
                        },
                        {
                          key: "matte",
                          num: "6",
                          name: "Matte",
                          color: PRODUCT_RANGE_COLORS.matte,
                        },
                        {
                          key: "illumine",
                          num: "7",
                          name: "Illumine",
                          color: PRODUCT_RANGE_COLORS.illumine,
                        },
                      ];
                  return (
                    <div key={sec.id}>
                      <div className="text-[0.65rem] uppercase tracking-widest font-semibold text-muted-foreground pb-2 border-b border-border mb-2">
                        {sec.title}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {rangesList.map((r: any) => (
                          <SheetClose asChild key={r.key}>
                            <Link
                              href={r.href || `/shop?range=${r.key}`}
                              className="flex min-h-[40px] items-center gap-2 px-2 rounded-sm border border-border/50 text-xs text-foreground/80 hover:text-foreground hover:bg-muted"
                            >
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: r.color }}
                              />
                              <span>
                                {(() => {
                                  const raw = String(r.name || "");
                                  const clean = raw.replace(/^(\d+)\s+/, "");
                                  return r.num ? `${r.num} ${clean}` : raw;
                                })()}
                              </span>
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (sec.type === "PRODUCT_CATEGORIES" || sec.type === "SKIN_CONCERNS") {
                  const itemsList = Array.isArray(sec.data) ? sec.data : [];
                  return (
                    <div key={sec.id}>
                      <div className="text-[0.65rem] uppercase tracking-widest font-semibold text-muted-foreground pb-2 border-b border-border mb-2">
                        {sec.title}
                      </div>
                      <ul className="space-y-1 text-xs">
                        {itemsList.map((item: any) => (
                          <li key={item.slug}>
                            <SheetClose asChild>
                              <Link
                                href={item.href || `/shop?category=${item.slug}`}
                                className="flex min-h-[40px] items-center px-2 text-foreground/80 hover:text-foreground"
                              >
                                {item.label}
                              </Link>
                            </SheetClose>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                return null;
              })}

              <div className="pt-2">
                <SheetClose asChild>
                  <Link
                    href={activeSubmenuItem.url || "/shop"}
                    className="flex min-h-[44px] items-center justify-center rounded-sm bg-muted text-xs uppercase tracking-widest font-medium text-foreground hover:bg-muted/80"
                  >
                    {t("allFace")}
                  </Link>
                </SheetClose>
              </div>
            </div>
          )}

          {/* SUBMENU SCREEN FOR SIMPLE DROPDOWN */}
          {screen !== "root" && activeSubmenuItem?.type === "SIMPLE_DROPDOWN" && (
            <div className="space-y-4">
              <div className="text-[0.65rem] uppercase tracking-widest font-semibold text-muted-foreground pb-2 border-b border-border">
                {activeSubmenuItem.label}
              </div>
              <ul className="space-y-1 text-xs">
                {activeSubmenuItem.dropdownItems?.map((drop) => (
                  <li key={drop.id}>
                    <SheetClose asChild>
                      <Link
                        href={drop.url}
                        className="flex min-h-[44px] items-center justify-between px-2 text-foreground/90 hover:text-sf-champagne"
                      >
                        <span>{drop.label}</span>
                        {drop.badge && (
                          <span className="text-[0.7rem] text-muted-foreground">
                            {drop.badge}
                          </span>
                        )}
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
