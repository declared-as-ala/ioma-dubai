"use client";

import { QueryState } from "@/components/account/experience-ui";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { useProtocols } from "@/hooks/use-protocols";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Video, Clock, Sparkles } from "lucide-react";

export default function PortalProtocolsPage() {
  const t = useTranslations("Pro.protocols");
  const locale = useLocale() as Locale;
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categoryQuery = selectedCategory === "all" ? undefined : selectedCategory;
  const query = useProtocols(categoryQuery);
  const { data: protocols, isLoading } = query;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-light tracking-tight text-ioma-black md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-ioma-grey-500">{t("subtitle")}</p>
        </div>

        {/* Category filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCategories")}</SelectItem>
            <SelectItem value="facial">{t("facial")}</SelectItem>
            <SelectItem value="body">{t("body")}</SelectItem>
            <SelectItem value="homecare">{t("homecare")}</SelectItem>
            <SelectItem value="diagnostic">{t("diagnostic")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <QueryState query={query}>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-ioma-grey-100" />
            ))}
          </div>
        ) : protocols && protocols.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {protocols.map((proto) => (
              <Card key={proto._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="capitalize">
                      {t(proto.category)}
                    </Badge>
                    <span className="text-xs text-ioma-grey-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {proto.durationMinutes} min
                    </span>
                  </div>
                  <CardTitle className="text-xl font-light mt-2">
                    {proto.title[locale] || proto.title.en}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-ioma-grey-600">
                    {proto.description[locale] || proto.description.en}
                  </p>

                  {proto.applicableRangeKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proto.applicableRangeKeys.map((r, i) => (
                        <Badge key={i} variant="outline" className="text-xs uppercase">
                          <Sparkles className="me-1 h-3 w-3 text-foreground" />
                          {r}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {proto.pdfUrl ? (
                      <Button size="sm" asChild variant="outline">
                        <a href={proto.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="me-2 h-4 w-4 text-rose-600" />
                          {t("downloadPdf")}
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        <FileText className="me-2 h-4 w-4 text-ioma-grey-400" />
                        {t("pdfPending")}
                      </Button>
                    )}

                    {proto.videoUrl && (
                      <Button size="sm" asChild variant="secondary">
                        <a
                          href={proto.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Video className="me-2 h-4 w-4 text-blue-600" />
                          {t("watchVideo")}
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-ioma-grey-500">{t("noProtocols")}</p>
            </CardContent>
          </Card>
        )}
      </QueryState>
    </div>
  );
}
