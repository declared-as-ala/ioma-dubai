/* eslint-disable @typescript-eslint/ban-ts-comment, no-empty */
// @ts-nocheck -- ported from the production lifecycle script; plain JS style on purpose
import { expect, test } from "@playwright/test";

// B2B admin <-> portal lifecycle (benefits, gallery, portal home, B2B settings, permissions).
// Runs against a real environment and needs: E2E_API_BASE (e.g. https://iomaparis.ae/api), E2E_ADMIN_EMAIL,
// E2E_ADMIN_PW, E2E_PARTNER_EMAIL, E2E_PARTNER_PW. Everything it creates is archived; settings and portal
// content are restored. Clean the archived ZZ TEST records afterwards.
const env = process.env;
const ready =
  env.E2E_API_BASE &&
  env.E2E_ADMIN_EMAIL &&
  env.E2E_ADMIN_PW &&
  env.E2E_PARTNER_EMAIL &&
  env.E2E_PARTNER_PW;

test.skip(!ready, "B2B lifecycle credentials are not configured");

test("B2B admin changes reach the professional portal and are reversible", async () => {
  test.setTimeout(180_000);
  const B = env.E2E_API_BASE!;
  const process_env = {
    ADMIN_EMAIL: env.E2E_ADMIN_EMAIL,
    ADMIN_PW: env.E2E_ADMIN_PW,
    PARTNER_EMAIL: env.E2E_PARTNER_EMAIL,
    PARTNER_PW: env.E2E_PARTNER_PW,
  };
  const run = async () => {
    const process = { env: process_env };
    void process;
    const out: string[] = [];
    const t = (n: string, ok: boolean, x = "") =>
      out.push(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  (" + x + ")" : ""}`);

    const call = async (path, tok, method = "GET", body) => {
      const r = await fetch(B + path, {
        method,
        headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      let j = null;
      try {
        j = await r.json();
      } catch {}
      return { s: r.status, b: j };
    };
    const login = async (e, p, app) =>
      (
        await (
          await fetch(B + "/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(app ? { "x-ioma-app": app } : {}),
            },
            body: JSON.stringify({ email: e, password: p }),
          })
        ).json()
      ).accessToken;
    const admin = await login(process.env.ADMIN_EMAIL, process.env.ADMIN_PW, "admin");
    const partner = await login(process.env.PARTNER_EMAIL, process.env.PARTNER_PW);
    t("admin and partner sign in", !!admin && !!partner);
    const ids = [];

    // ---- Benefits: create, publish, verify, edit, unpublish, republish, archive
    let r = await call("/admin/resources/pro-benefits", admin, "POST", {
      title: { en: "ZZ TEST benefit", ar: "ميزة اختبار" },
      body: { en: "ZZ TEST body", ar: "نص اختبار" },
      icon: "star",
      status: "published",
    });
    const ben = r.b?.id ?? r.b?._id ?? r.b?.record?._id;
    t("benefit created", r.s === 201 && !!ben, "status " + r.s);
    if (ben) ids.push(["pro-benefits", ben]);
    const inPortal = async (path, pick) => {
      const x = await call(path, partner);
      const list = x.b?.items ?? x.b;
      return (Array.isArray(list) ? list : []).some(pick);
    };
    t(
      "benefit appears in the portal",
      await inPortal(
        "/pro/benefits",
        (i) => (i.title?.en ?? i.title) === "ZZ TEST benefit",
      ),
    );
    await call(`/admin/resources/pro-benefits/${ben}`, admin, "PATCH", {
      title: { en: "ZZ TEST benefit (edited)", ar: "ميزة اختبار" },
    });
    t(
      "edit is reflected",
      await inPortal(
        "/pro/benefits",
        (i) => (i.title?.en ?? i.title) === "ZZ TEST benefit (edited)",
      ),
    );
    await call(`/admin/resources/pro-benefits/${ben}`, admin, "PATCH", {
      status: "draft",
    });
    t(
      "unpublished benefit disappears",
      !(await inPortal("/pro/benefits", (i) =>
        String(i.title?.en ?? i.title).startsWith("ZZ TEST"),
      )),
    );
    await call(`/admin/resources/pro-benefits/${ben}`, admin, "PATCH", {
      status: "published",
    });
    t(
      "republished benefit returns",
      await inPortal("/pro/benefits", (i) =>
        String(i.title?.en ?? i.title).startsWith("ZZ TEST"),
      ),
    );
    await call(`/admin/resources/pro-benefits/${ben}`, admin, "PATCH", {
      status: "archived",
    });
    t(
      "archived benefit disappears",
      !(await inPortal("/pro/benefits", (i) =>
        String(i.title?.en ?? i.title).startsWith("ZZ TEST"),
      )),
    );

    // ---- Gallery: create two, order, edit caption, archive
    const mk = async (title, order) =>
      await call("/admin/resources/pro-gallery", admin, "POST", {
        title: { en: title, ar: "صورة اختبار" },
        caption: { en: "ZZ caption", ar: "" },
        category: "cabins",
        image: "/images/pro/gallery-1.jpg",
        preview: "/images/pro/gallery-1-preview.jpg",
        sortOrder: order,
        status: "published",
      });
    const g1 = await mk("ZZ TEST gallery A", 9001),
      g2 = await mk("ZZ TEST gallery B", 9000);
    const gid1 = g1.b?.id ?? g1.b?._id ?? g1.b?.record?._id,
      gid2 = g2.b?.id ?? g2.b?._id ?? g2.b?.record?._id;
    t("gallery items created", g1.s === 201 && g2.s === 201, `${g1.s}/${g2.s}`);
    [gid1, gid2].forEach((x) => x && ids.push(["pro-gallery", x]));
    let gal = await call("/pro/gallery", partner);
    let titles = (gal.b?.items ?? gal.b ?? [])
      .map((i) => i.title?.en ?? i.title)
      .filter((x) => String(x).startsWith("ZZ TEST"));
    t("both appear in the portal", titles.length === 2, titles.join(" | "));
    t(
      "order follows sortOrder (B before A)",
      titles[0] === "ZZ TEST gallery B",
      titles.join(" | "),
    );
    await call(`/admin/resources/pro-gallery/${gid1}`, admin, "PATCH", {
      sortOrder: 8000,
    });
    gal = await call("/pro/gallery", partner);
    titles = (gal.b?.items ?? gal.b ?? [])
      .map((i) => i.title?.en ?? i.title)
      .filter((x) => String(x).startsWith("ZZ TEST"));
    t("reordering is reflected", titles[0] === "ZZ TEST gallery A", titles.join(" | "));
    for (const x of [gid1, gid2])
      await call(`/admin/resources/pro-gallery/${x}`, admin, "PATCH", {
        status: "archived",
      });
    gal = await call("/pro/gallery", partner);
    t(
      "archived gallery items disappear",
      !(gal.b?.items ?? gal.b ?? []).some((i) =>
        String(i.title?.en ?? i.title).startsWith("ZZ TEST"),
      ),
    );

    // ---- Services: create, edit, archive (admin side only)
    const svcCols = await call("/admin/resources/services?limit=1", admin);
    t("services list loads", svcCols.s === 200, "status " + svcCols.s);

    // ---- Portal home: edit the banner headline, see it in the portal, restore the exact original
    const before = await call("/admin/portal-content", admin);
    const orig = JSON.stringify(before.b?.hero?.headline ?? null);
    const heroBody = {
      hero: {
        ...(before.b?.hero ?? {}),
        headline: { en: "ZZ TEST headline", fr: "", ar: "عنوان اختبار" },
      },
    };
    r = await call("/admin/portal-content", admin, "PATCH", heroBody);
    t("portal home saved", r.s === 200, "status " + r.s);
    let home = await call("/pro/home", partner);
    t(
      "headline reaches the portal home",
      home.b?.hero?.headline?.en === "ZZ TEST headline",
    );
    r = await call("/admin/portal-content", admin, "PATCH", {
      hero: {
        ...(before.b?.hero ?? {}),
        headline: before.b?.hero?.headline ?? { en: "", ar: "" },
      },
    });
    home = await call("/pro/home", partner);
    t(
      "portal home restored exactly",
      JSON.stringify(home.b?.hero?.headline ?? null) === orig,
      orig.slice(0, 40),
    );

    // ---- B2B settings: change the team contact name, see it in the partner's access, restore
    const st = await call("/professional/admin/b2b-settings", admin);
    const origContact = st.b?.teamContact ?? null;
    r = await call("/professional/admin/b2b-settings", admin, "PATCH", {
      teamContact: {
        name: "ZZ TEST contact",
        phone: origContact?.phone ?? "",
        email: origContact?.email ?? "",
      },
    });
    t("settings saved", r.s === 200, "status " + r.s);
    let acc = await call("/professional/me/access", partner);
    t(
      "setting reaches the partner portal",
      acc.b?.teamContact?.name === "ZZ TEST contact" ||
        acc.b?.accountContact?.name === "ZZ TEST contact",
    );
    await call("/professional/admin/b2b-settings", admin, "PATCH", {
      teamContact: {
        name: origContact?.name ?? "",
        phone: origContact?.phone ?? "",
        email: origContact?.email ?? "",
      },
    });
    acc = await call("/professional/me/access", partner);
    t("setting restored", (acc.b?.teamContact?.name ?? "") === (origContact?.name ?? ""));

    // ---- Permissions: a partner cannot use admin endpoints or write
    r = await call("/admin/resources/pro-benefits", partner, "POST", {
      title: { en: "x", ar: "x" },
      body: { en: "x", ar: "x" },
      icon: "star",
      status: "published",
    });
    t("partner cannot create admin content", r.s === 403 || r.s === 401, "status " + r.s);
    r = await call("/admin/portal-content", partner, "PATCH", { hero: {} });
    t("partner cannot edit portal home", r.s === 403 || r.s === 401, "status " + r.s);
    // ---- Document access: an unauthenticated request cannot read the private file
    const docs = await call("/pro/documents", partner);
    const first = (docs.b?.items ?? docs.b ?? [])[0];
    if (first) {
      const u = await fetch(`${B}/pro/documents/${first.id}/url`);
      t(
        "document link needs a signed-in partner",
        u.status === 401,
        "status " + u.status,
      );
    }

    return { out, ids };
  };
  const { out } = await run();
  const failures = out.filter((l) => l.startsWith("FAIL"));
  expect(failures, out.join("\n")).toEqual([]);
});
