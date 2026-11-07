/**
 * IOMA Paris — Shopify Rich Text Parser & Normalizer
 *
 * Handles Shopify metafield AST structures:
 *   { type: 'root', children: [ ... ] }
 *
 * Supported nodes:
 *   - root, paragraph, heading, list, list-item, link, text
 *   - bold, italic, line breaks
 *
 * Converts safely to:
 *   1. Normalized plain text (with clean line breaks & bullets)
 *   2. Sanitized semantic HTML
 *   3. Structured clinical results (percentages, claims, footnotes)
 */

export interface ShopifyTextNode {
  type: "text";
  value: string;
  bold?: boolean;
  italic?: boolean;
}

export interface ShopifyLinkNode {
  type: "link";
  url: string;
  title?: string;
  children: ShopifyNode[];
}

export interface ShopifyParagraphNode {
  type: "paragraph";
  children: ShopifyNode[];
}

export interface ShopifyHeadingNode {
  type: "heading";
  level: number;
  children: ShopifyNode[];
}

export interface ShopifyListItemNode {
  type: "list-item";
  children: ShopifyNode[];
}

export interface ShopifyListNode {
  type: "list";
  listType: "unordered" | "ordered";
  children: ShopifyListItemNode[];
}

export interface ShopifyRootNode {
  type: "root";
  children: ShopifyNode[];
}

export type ShopifyNode =
  | ShopifyRootNode
  | ShopifyParagraphNode
  | ShopifyHeadingNode
  | ShopifyListNode
  | ShopifyListItemNode
  | ShopifyLinkNode
  | ShopifyTextNode;

export interface StructuredClinicalResult {
  hasStats: boolean;
  intro?: string;
  stats: Array<{ percentage: string; claim: string }>;
  narrative: string;
  footnote?: string;
}

/**
 * Detect whether input is a Shopify rich-text AST or serialized JSON representing it
 */
export function isShopifyRichText(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === "object" && value !== null && (value as any).type === "root") {
    return true;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith("{") || trimmed.startsWith('"{')) &&
      trimmed.includes('"type"') &&
      trimmed.includes('"root"')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Parse input into ShopifyRootNode if possible
 */
export function parseShopifyAst(value: unknown): ShopifyRootNode | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && (value as any).type === "root") {
    return value as ShopifyRootNode;
  }
  if (typeof value === "string") {
    let str = value.trim();
    // Handle double-escaped string (e.g. "\"{\\\"type\\\":\\\"root\\\"...}\"")
    if (str.startsWith('"') && str.endsWith('"') && str.includes('\\"type\\"')) {
      try {
        str = JSON.parse(str);
      } catch {
        // continue
      }
    }
    if (str.startsWith("{") && str.includes('"type"') && str.includes('"root"')) {
      try {
        const parsed = JSON.parse(str);
        if (parsed && typeof parsed === "object" && parsed.type === "root") {
          return parsed as ShopifyRootNode;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Check if a text or content string is truly empty
 */
export function isEmptyContent(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return true;
    if (trimmed === "{}" || trimmed === '{"type":"root","children":[]}') return true;
    // Check if after stripping HTML or AST it is empty
    const text = normalizeShopifyRichText(trimmed);
    return !text || text.trim().length === 0;
  }
  if (typeof value === "object") {
    const text = normalizeShopifyRichText(value);
    return !text || text.trim().length === 0;
  }
  return false;
}

/**
 * Convert any Shopify rich-text, HTML or raw string into clean, readable Plain Text
 */
export function normalizeShopifyRichText(value: unknown): string {
  if (!value) return "";

  const ast = parseShopifyAst(value);
  if (ast) {
    return astToPlainText(ast).trim();
  }

  if (typeof value === "string") {
    let str = value.trim();
    // Handle JSON string that wasn't caught
    if (str.startsWith("{") && str.includes('"type"')) {
      try {
        const parsed = JSON.parse(str);
        if (parsed.type === "root") return astToPlainText(parsed).trim();
      } catch {
        // continue
      }
    }

    // Strip HTML tags if HTML
    if (str.includes("<") && str.includes(">")) {
      str = str
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<li[^>]*>/gi, "• ")
        .replace(/<[^>]*>/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s+\n/g, "\n\n")
        .trim();
    }

    return str.trim();
  }

  return String(value).trim();
}

function astToPlainText(node: ShopifyNode, listIndex?: number): string {
  if (!node) return "";

  if (node.type === "text") {
    return node.value || "";
  }

  if (node.type === "paragraph") {
    const text = (node.children || []).map((c) => astToPlainText(c)).join("");
    return text ? `${text}\n\n` : "";
  }

  if (node.type === "heading") {
    const text = (node.children || []).map((c) => astToPlainText(c)).join("");
    return text ? `${text}\n\n` : "";
  }

  if (node.type === "link") {
    return (node.children || []).map((c) => astToPlainText(c)).join("");
  }

  if (node.type === "list-item") {
    const text = (node.children || [])
      .map((c) => astToPlainText(c))
      .join("")
      .trim();
    const prefix = typeof listIndex === "number" ? `${listIndex}. ` : "• ";
    return text ? `${prefix}${text}\n` : "";
  }

  if (node.type === "list") {
    const isOrdered = node.listType === "ordered";
    const items = (node.children || []).map((c, i) =>
      astToPlainText(c, isOrdered ? i + 1 : undefined),
    );
    return `${items.join("")}\n`;
  }

  if (node.type === "root") {
    const parts = (node.children || []).map((c) => astToPlainText(c));
    return parts
      .join("")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return "";
}

/**
 * Sanitize URL to prevent javascript: or unsafe schemes
 */
function sanitizeUrl(url: string): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) {
    return "#";
  }
  return trimmed;
}

/**
 * Escape HTML special chars
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Convert Shopify rich-text AST into safe semantic HTML
 */
export function normalizeShopifyRichTextToHtml(value: unknown): string {
  if (!value) return "";

  const ast = parseShopifyAst(value);
  if (ast) {
    return astToHtml(ast).trim();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    // If it's already safe HTML, return it cleaned
    if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
      return trimmed;
    }
    // If it's plain text, convert double newlines to paragraphs
    const paragraphs = trimmed
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length <= 1) {
      return `<p>${escapeHtml(trimmed).replace(/\n/g, "<br />")}</p>`;
    }
    return paragraphs
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
      .join("");
  }

  return `<p>${escapeHtml(String(value))}</p>`;
}

function astToHtml(node: ShopifyNode): string {
  if (!node) return "";

  if (node.type === "text") {
    let text = escapeHtml(node.value || "");
    if (node.bold) text = `<strong>${text}</strong>`;
    if (node.italic) text = `<em>${text}</em>`;
    return text;
  }

  if (node.type === "paragraph") {
    const inner = (node.children || []).map(astToHtml).join("");
    return inner ? `<p>${inner}</p>` : "";
  }

  if (node.type === "heading") {
    const level = Math.min(Math.max(node.level || 3, 2), 6);
    const inner = (node.children || []).map(astToHtml).join("");
    return inner ? `<h${level}>${inner}</h${level}>` : "";
  }

  if (node.type === "link") {
    const inner = (node.children || []).map(astToHtml).join("");
    const safeHref = sanitizeUrl(node.url);
    const titleAttr = node.title ? ` title="${escapeHtml(node.title)}"` : "";
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer"${titleAttr}>${inner}</a>`;
  }

  if (node.type === "list-item") {
    const inner = (node.children || []).map(astToHtml).join("");
    return `<li>${inner}</li>`;
  }

  if (node.type === "list") {
    const tag = node.listType === "ordered" ? "ol" : "ul";
    const inner = (node.children || []).map(astToHtml).join("");
    return `<${tag}>${inner}</${tag}>`;
  }

  if (node.type === "root") {
    return (node.children || []).map(astToHtml).join("");
  }

  return "";
}

/**
 * Extract Clinical Results into structured percentage cards, intro and footnote
 */
export function extractClinicalResults(value: unknown): StructuredClinicalResult {
  const plainText = normalizeShopifyRichText(value);
  if (!plainText) {
    return { hasStats: false, stats: [], narrative: "" };
  }

  const lines = plainText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const stats: Array<{ percentage: string; claim: string }> = [];
  const narrativeLines: string[] = [];
  let footnote: string | undefined;

  for (const line of lines) {
    // Check footnote (starts with * or Note:)
    if (line.startsWith("*") || line.toLowerCase().startsWith("note:")) {
      footnote = (footnote ? `${footnote} ` : "") + line;
      continue;
    }

    // Match percentage patterns: "93% plus jeune*", "• 91% de fermeté", "88% : peau lissée"
    const pctMatch = line.match(
      /^(?:•|-|\d+\.)?\s*(\d+[.,]?\d*%\s*(?:\([^)]+\))?)\s*[:–-]?\s*(.+)$/i,
    );
    if (pctMatch && pctMatch[1] && pctMatch[2]) {
      const percentage = pctMatch[1].trim();
      let claim = pctMatch[2].trim();
      // Remove trailing footnote star if it's attached to the claim
      if (claim.endsWith("*")) claim = claim.slice(0, -1).trim();
      stats.push({ percentage, claim });
      continue;
    }

    narrativeLines.push(line);
  }

  const hasStats = stats.length > 0;
  let intro: string | undefined;
  let narrative = narrativeLines.join("\n\n");

  if (hasStats && narrativeLines.length > 0) {
    // First line before stats is often the intro headline
    intro = narrativeLines[0];
    narrative = narrativeLines.slice(1).join("\n\n");
  }

  return {
    hasStats,
    intro,
    stats,
    narrative,
    footnote,
  };
}
