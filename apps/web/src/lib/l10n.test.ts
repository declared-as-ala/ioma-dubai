import { describe, expect, it } from "vitest";
import { looksFrench, pickText } from "./l10n";

const FR = "Appliquer matin et soir sur une peau nettoyée, après votre sérum.";
const EN = "Apply morning and evening to cleansed skin, after your serum.";

describe("looksFrench", () => {
  it("recognises French copy and leaves English alone", () => {
    expect(looksFrench(FR)).toBe(true);
    expect(looksFrench(EN)).toBe(false);
  });
});

describe("looksFrench short taglines", () => {
  it("catches short French taglines and leaves English ones", () => {
    expect(looksFrench("Hydratation intense et longue durée")).toBe(true);
    expect(looksFrench("Contre les ridules de déshydratation")).toBe(true);
    expect(looksFrench("Intense, long-lasting hydration")).toBe(false);
    expect(looksFrench("Eye contour care")).toBe(false);
  });
});

describe("pickText", () => {
  it("never shows French on the English page", () => {
    expect(pickText({ en: FR, fr: FR }, "en")).toBe("");
    expect(pickText({ en: EN, fr: FR }, "en")).toBe(EN);
  });
  it("Arabic uses Arabic, then English, never French", () => {
    expect(pickText({ ar: "ضعي الكريم صباحاً", en: EN }, "ar")).toBe("ضعي الكريم صباحاً");
    expect(pickText({ ar: FR, en: EN }, "ar")).toBe(EN);
    expect(pickText({ ar: FR, en: FR }, "ar")).toBe("");
  });
  it("French falls back to English", () => {
    expect(pickText({ fr: "", en: EN }, "fr")).toBe(EN);
    expect(pickText({ fr: FR, en: EN }, "fr")).toBe(FR);
  });
});
