"use client";
import { ProductImage } from "@/components/shop/product-image";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { EMIRATES } from "@ioma/config";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderAddressSchema, type OrderAddressInput } from "@ioma/validation";
import { motion, AnimatePresence } from "motion/react";
import { Link, useRouter } from "@/i18n/navigation";
import { useCartQuery } from "@/hooks/use-cart";
import { useCheckoutMutation } from "@/hooks/use-orders";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMinor } from "@/lib/money";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2;
type DeliveryMethod = "standard" | "express";

export default function CheckoutPage({
  professional = false,
}: {
  professional?: boolean;
}) {
  const t = useTranslations("Checkout");
  const cartEmptyLabel = useTranslations("Cart")("empty");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { data: cart } = useCartQuery(professional);

  const [step, setStep] = useState<Step>(0);
  const [address, setAddress] = useState<OrderAddressInput | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");

  const checkout = useCheckoutMutation(professional);

  const stepLabels = [t("steps.address"), t("steps.delivery"), t("steps.payment")];
  const stepStates = [
    t("stepStates.complete"),
    t("stepStates.current"),
    t("stepStates.upcoming"),
  ];

  if (cart && cart.items.length === 0 && !checkout.isPending && !checkout.data) {
    return (
      <main className="mx-auto max-w-[1440px] px-4 md:px-6 py-24">
        <p className="text-sm text-muted-foreground">{cartEmptyLabel}</p>
        <Button asChild className="mt-6 uppercase tracking-widest">
          <Link href="/shop">{t("backToShop")}</Link>
        </Button>
      </main>
    );
  }

  function submitPayment(paymentMethod: "mock_success" | "mock_failure") {
    if (!address) return;
    checkout.mutate(
      { shippingAddress: address, deliveryMethod, paymentMethod },
      {
        onSuccess: (order) => {
          const query = order.guestToken ? `?token=${order.guestToken}` : "";
          router.push(`/checkout/confirmation/${order.orderNumber}${query}`);
        },
      },
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-24">
      <ol
        className="grid grid-cols-3 gap-2 md:flex md:items-center md:gap-4"
        aria-label={t("progressLabel")}
        data-testid="checkout-progress"
      >
        {stepLabels.map((label, index) => (
          <li
            key={label}
            className="flex min-w-0 items-center justify-center gap-4 md:justify-start"
            aria-current={index === step ? "step" : undefined}
            data-status={
              index < step ? "complete" : index === step ? "current" : "upcoming"
            }
          >
            <span
              className={cn(
                "flex min-w-0 flex-col items-center gap-2 text-center text-[0.65rem] uppercase tracking-widest md:flex-row md:text-start md:text-xs",
                index === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-[0.65rem]",
                  index <= step
                    ? "border-sf-charcoal bg-sf-charcoal text-white"
                    : "border-border",
                )}
              >
                {index + 1}
              </span>
              <span className="flex min-w-0 flex-col items-center md:items-start">
                <span>{label}</span>
                <span className="text-[0.6rem] normal-case tracking-normal text-muted-foreground">
                  {index < step
                    ? stepStates[0]
                    : index === step
                      ? stepStates[1]
                      : stepStates[2]}
                </span>
              </span>
            </span>
            {index < stepLabels.length - 1 ? (
              <span aria-hidden className="hidden h-px w-8 bg-border md:block" />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="ioma-step-panel mt-10 rounded-[1.75rem] bg-sf-ivory p-6 md:p-10">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            >
              <AddressStep
                defaultValues={address}
                onContinue={(values) => {
                  setAddress(values);
                  setStep(1);
                }}
              />
            </motion.div>
          ) : null}

          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            >
              <DeliveryStep
                value={deliveryMethod}
                onChange={setDeliveryMethod}
                onBack={() => setStep(0)}
                onContinue={() => setStep(2)}
                freeShipping={(cart?.subtotalMinor ?? 0) >= 30000}
              />
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            >
              <PaymentStep
                onBack={() => setStep(1)}
                onSubmit={submitPayment}
                isPending={checkout.isPending}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {cart ? (
        <div className="mt-16 border-t border-border pt-6 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("summarySubtotal")}</span>
            <span>{formatMinor(cart.subtotalMinor, locale)}</span>
          </div>
          <ul className="mt-4 divide-y">
            {cart.items.map((item) => (
              <li key={item.sku} className="flex items-center gap-3 py-3">
                <span className="relative block size-14 shrink-0">
                  <ProductImage
                    src={item.product?.images[0]}
                    alt={item.product?.name[locale] ?? item.sku}
                    fill
                    variant="thumbnail"
                    sizes="56px"
                    className="object-contain"
                  />
                </span>
                <span className="min-w-0 text-sm">
                  {item.product?.name[locale]} · {item.qty}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}

function AddressStep({
  defaultValues,
  onContinue,
}: {
  defaultValues: OrderAddressInput | null;
  onContinue: (values: OrderAddressInput) => void;
}) {
  const t = useTranslations("Checkout");
  const locale = useLocale() as Locale;

  const form = useForm<OrderAddressInput>({
    resolver: zodResolver(orderAddressSchema),
    defaultValues: defaultValues ?? {
      fullName: "",
      phone: "",
      emirate: "",
      city: "",
      addressLine1: "",
      addressLine2: "",
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onContinue)} noValidate>
      <h2 className="font-display text-2xl">{t("addressTitle")}</h2>
      <FieldGroup className="mt-6">
        <Controller
          name="fullName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="checkout-fullname">{t("fullName")}</FieldLabel>
              <Input
                {...field}
                id="checkout-fullname"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="checkout-phone">{t("phone")}</FieldLabel>
              <Input
                {...field}
                id="checkout-phone"
                type="tel"
                autoComplete="tel"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="emirate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="checkout-emirate">{t("emirate")}</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="checkout-emirate" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMIRATES.map((emirate) => (
                      <SelectItem key={emirate.code} value={emirate.code}>
                        {emirate.name[locale]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="city"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="checkout-city">{t("city")}</FieldLabel>
                <Input
                  {...field}
                  id="checkout-city"
                  autoComplete="address-level2"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        <Controller
          name="addressLine1"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="checkout-address1">{t("addressLine1")}</FieldLabel>
              <Input
                {...field}
                id="checkout-address1"
                autoComplete="address-line1"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="addressLine2"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="checkout-address2">{t("addressLine2")}</FieldLabel>
              <Input {...field} id="checkout-address2" autoComplete="address-line2" />
            </Field>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="mt-4 w-fit uppercase tracking-widest"
          data-testid="checkout-address-continue"
        >
          {t("continue")}
        </Button>
      </FieldGroup>
    </form>
  );
}

function DeliveryStep({
  value,
  onChange,
  onBack,
  onContinue,
  freeShipping,
}: {
  value: DeliveryMethod;
  onChange: (value: DeliveryMethod) => void;
  onBack: () => void;
  onContinue: () => void;
  freeShipping: boolean;
}) {
  const t = useTranslations("Checkout");

  const options: { value: DeliveryMethod; label: string }[] = [
    { value: "standard", label: t("standard") },
    { value: "express", label: t("express") },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl">{t("deliveryTitle")}</h2>
      {freeShipping ? (
        <p className="mt-2 text-sm text-muted-foreground">{t("freeShippingNote")}</p>
      ) : null}
      <div
        role="radiogroup"
        aria-label={t("deliveryTitle")}
        className="mt-6 flex flex-col gap-3"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            data-testid={`delivery-${option.value}`}
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md border px-4 py-3 text-start text-sm transition-colors",
              value === option.value
                ? "border-foreground bg-accent"
                : "border-border hover:border-foreground/40",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-8 flex gap-4">
        <Button variant="outline" onClick={onBack}>
          {t("back")}
        </Button>
        <Button
          onClick={onContinue}
          className="uppercase tracking-widest"
          data-testid="checkout-delivery-continue"
        >
          {t("continue")}
        </Button>
      </div>
    </div>
  );
}

function PaymentStep({
  onBack,
  onSubmit,
  isPending,
}: {
  onBack: () => void;
  onSubmit: (paymentMethod: "mock_success" | "mock_failure") => void;
  isPending: boolean;
}) {
  const t = useTranslations("Checkout");

  return (
    <div>
      <h2 className="font-display text-2xl">{t("paymentTitle")}</h2>
      <div
        role="status"
        className="mt-6 rounded-2xl border border-sf-champagne/40 bg-white p-4 text-sm text-foreground/90"
      >
        {t("paymentDemoBanner")}
      </div>
      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <Button
          size="lg"
          data-testid="payment-success"
          disabled={isPending}
          onClick={() => onSubmit("mock_success")}
          className="uppercase tracking-widest"
        >
          {t("simulateSuccess")}
        </Button>
        <Button
          size="lg"
          variant="outline"
          data-testid="payment-failure"
          disabled={isPending}
          onClick={() => onSubmit("mock_failure")}
          className="uppercase tracking-widest"
        >
          {t("simulateFailure")}
        </Button>
      </div>
      <Button variant="outline" onClick={onBack} disabled={isPending} className="mt-8">
        {t("back")}
      </Button>
    </div>
  );
}
