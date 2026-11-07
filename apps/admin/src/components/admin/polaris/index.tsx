"use client";

// Reusable Polaris-style admin primitives. Presentation only: every component
// forwards native props/handlers untouched, so swapping markup for these never
// changes behaviour. Styling lives in ./polaris.css (tokens + classes).

import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/* ------------------------------ Card ------------------------------ */
export function Card({
  title,
  action,
  footer,
  flush,
  className,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  /** Optional footer row (e.g. a collapsible "extra settings" trigger). */
  footer?: ReactNode;
  flush?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section className={cn("pl-card", flush && "pl-card--flush", className)}>
      {(title || action) && (
        <div className="pl-card-head">
          {title && <h2 className="pl-card-title">{title}</h2>}
          {action}
        </div>
      )}
      {children}
      {footer}
    </section>
  );
}

export function CardFooterButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="pl-card-footer" {...props}>
      {children}
    </button>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="pl-section-title">{children}</h2>;
}

/* ------------------------------ Field ----------------------------- */
export function Field({
  label,
  htmlFor,
  help,
  error,
  className,
  children,
}: {
  label?: ReactNode;
  htmlFor?: string;
  help?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="pl-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="pl-error">
          {error}
        </p>
      ) : (
        help && <p className="pl-help">{help}</p>
      )}
    </div>
  );
}

/* ------------------- Input / Textarea / Select -------------------- */
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; alignEnd?: boolean }
>(function Input({ className, invalid, alignEnd, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || props["aria-invalid"] || undefined}
      className={cn("pl-input", alignEnd && "pl-input--end", className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || props["aria-invalid"] || undefined}
      className={cn("pl-input", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <span className="pl-select-wrap">
      <select
        ref={ref}
        aria-invalid={invalid || props["aria-invalid"] || undefined}
        className={cn("pl-input", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronsUpDown className="pl-select-chevron" aria-hidden />
    </span>
  );
});

/* ----------------------------- Buttons ---------------------------- */
type Variant = "primary" | "secondary" | "plain" | "link" | "destructive";
const variantClass: Record<Variant, string> = {
  primary: "pl-btn--primary",
  secondary: "",
  plain: "pl-btn--plain",
  link: "pl-btn--plain pl-btn--link",
  destructive: "pl-btn--plain pl-btn--destructive",
};
const btnClass = (variant: Variant, small?: boolean, className?: string) =>
  cn("pl-btn", variantClass[variant], small && "pl-btn--sm", className);

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean }
>(function Button(
  { variant = "secondary", small, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={btnClass(variant, small, className)}
      {...props}
    />
  );
});

export function ButtonLink({
  variant = "secondary",
  small,
  className,
  href,
  target,
  children,
}: {
  variant?: Variant;
  small?: boolean;
  className?: string;
  href: string;
  target?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} target={target} className={btnClass(variant, small, className)}>
      {children}
    </Link>
  );
}

/** Plain <a> styled like a button, for links that leave the admin app. */
export function ExternalButtonLink({
  variant = "secondary",
  small,
  className,
  href,
  children,
}: {
  variant?: Variant;
  small?: boolean;
  className?: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={btnClass(variant, small, className)}
    >
      {children}
    </a>
  );
}

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; destructive?: boolean }
>(function IconButton(
  { label, destructive, className, type = "button", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn("pl-icon-btn", destructive && "pl-icon-btn--destructive", className)}
      {...props}
    >
      {children}
    </button>
  );
});

/* ------------------------------ Badge ----------------------------- */
export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: "success" | "neutral" | "warning" | "critical";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("pl-badge", tone !== "neutral" && `pl-badge--${tone}`, className)}
    >
      {icon}
      {children}
    </span>
  );
}

/* ------------------------------- Tag ------------------------------ */
export function Tag({
  children,
  onRemove,
  removeLabel = "Remove",
}: {
  children: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <span className="pl-tag">
      {children}
      {onRemove && (
        <button
          type="button"
          className="pl-tag-remove"
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <X size={12} aria-hidden />
        </button>
      )}
    </span>
  );
}

/* --------------------- Checkbox / Radio / Toggle ------------------ */
export function Checkbox({
  label,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: ReactNode }) {
  return (
    <label className={cn("pl-choice", className)}>
      <input type="checkbox" className="pl-check" {...props} />
      {label}
    </label>
  );
}

export function Radio({
  label,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: ReactNode }) {
  return (
    <label className={cn("pl-choice", className)}>
      <input type="radio" className="pl-radio" {...props} />
      {label}
    </label>
  );
}

export function Toggle({
  label,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & { label?: ReactNode }) {
  return (
    <label className={cn("pl-choice", className)}>
      <input type="checkbox" role="switch" className="pl-toggle" {...props} />
      {label}
    </label>
  );
}

/* ------------------------ Segmented control ----------------------- */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="pl-seg">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className="pl-seg-item"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- DataTable -------------------------- */
export interface Column {
  key: string;
  label: ReactNode;
  numeric?: boolean;
  width?: string;
}
/** Presentational table: callers render <tr>/<td> rows as children. */
export function DataTable({
  columns,
  minWidth = 520,
  children,
}: {
  columns: Column[];
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <div className="pl-table-wrap">
      <table className="pl-table" style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={c.numeric ? "pl-num" : undefined}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* ----------------------------- MediaTile -------------------------- */
export function MediaTile({
  primary,
  badge,
  actions,
  className,
  children,
}: {
  primary?: boolean;
  badge?: ReactNode;
  /** Icon buttons shown in a floating bar on hover / keyboard focus. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("pl-media-tile", primary && "pl-media-tile--primary", className)}>
      {children}
      {badge && <span className="pl-media-badge">{badge}</span>}
      {actions && (
        <div className="pl-media-actions">
          <div className="pl-media-actions-bar">{actions}</div>
        </div>
      )}
    </div>
  );
}
