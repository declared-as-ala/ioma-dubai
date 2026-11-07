"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactMessageSchema, type ContactMessageInput } from "@ioma/validation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useContactMutation } from "@/hooks/use-contact-mutation";
import { CONTACT } from "@/content/services";

const F = CONTACT.form;

/** Contact form: validated on the client and again on the server, honeypot + server rate limit against spam. */
export function ServiceContactForm() {
  const locale = useLocale() as "en" | "ar";
  const loc = locale === "ar" ? "ar" : "en";
  const mutation = useContactMutation();
  const successRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<ContactMessageInput>({
    resolver: zodResolver(contactMessageSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      locale,
      category: "order",
      orderReference: "",
      website: "",
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (mutation.isSuccess) successRef.current?.focus();
  }, [mutation.isSuccess]);

  // Map the shared schema's English messages onto the page language.
  const msg = (field: keyof ContactMessageInput) => {
    const e = errors[field];
    if (!e) return undefined;
    if (field === "email") return F.badEmail[loc];
    if (field === "message") return F.shortMessage[loc];
    return F.required[loc];
  };

  const onSubmit = (values: ContactMessageInput) => {
    mutation.mutate(
      {
        ...values,
        orderReference: values.orderReference?.trim() || undefined,
        website: values.website ?? "",
      },
      {
        onSuccess: () =>
          form.reset({
            name: "",
            email: "",
            subject: "",
            message: "",
            locale,
            category: "order",
            orderReference: "",
            website: "",
          }),
      },
    );
  };

  if (mutation.isSuccess) {
    return (
      <div role="status" className="rounded-[2rem] bg-sf-ivory p-10 text-center md:p-14">
        <h2
          ref={successRef}
          tabIndex={-1}
          className="font-display text-3xl font-medium outline-none"
        >
          {F.successTitle[loc]}
        </h2>
        <p className="mt-4 text-muted-foreground">{F.successBody[loc]}</p>
        <Button
          variant="outline"
          className="mt-8 h-11 rounded-full px-7 uppercase tracking-widest"
          onClick={() => mutation.reset()}
        >
          {F.again[loc]}
        </Button>
      </div>
    );
  }

  const field = "space-y-2";
  const label = "text-sm font-medium";
  const err = "text-sm text-destructive";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-6 rounded-[2rem] bg-sf-ivory p-6 md:p-10"
      aria-busy={mutation.isPending}
    >
      <div className={field}>
        <label htmlFor="cf-category" className={label}>
          {F.category[loc]}
        </label>
        <select
          id="cf-category"
          {...register("category")}
          className="h-12 w-full rounded-xl border border-border bg-white px-4 text-base outline-none focus-visible:border-sf-champagne focus-visible:ring-2 focus-visible:ring-sf-champagne/40"
        >
          {CONTACT.categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label[loc]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className={field}>
          <label htmlFor="cf-name" className={label}>
            {F.name[loc]}
          </label>
          <Input
            id="cf-name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "cf-name-err" : undefined}
            className="h-12 rounded-xl bg-white"
            {...register("name")}
          />
          {errors.name ? (
            <p id="cf-name-err" role="alert" className={err}>
              {msg("name")}
            </p>
          ) : null}
        </div>
        <div className={field}>
          <label htmlFor="cf-email" className={label}>
            {F.email[loc]}
          </label>
          <Input
            id="cf-email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "cf-email-err" : undefined}
            className="h-12 rounded-xl bg-white"
            {...register("email")}
          />
          {errors.email ? (
            <p id="cf-email-err" role="alert" className={err}>
              {msg("email")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className={field}>
          <label htmlFor="cf-subject" className={label}>
            {F.subject[loc]}
          </label>
          <Input
            id="cf-subject"
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? "cf-subject-err" : undefined}
            className="h-12 rounded-xl bg-white"
            {...register("subject")}
          />
          {errors.subject ? (
            <p id="cf-subject-err" role="alert" className={err}>
              {msg("subject")}
            </p>
          ) : null}
        </div>
        <div className={field}>
          <label htmlFor="cf-order" className={label}>
            {F.order[loc]}
          </label>
          <Input
            id="cf-order"
            aria-describedby="cf-order-hint"
            autoComplete="off"
            className="h-12 rounded-xl bg-white"
            {...register("orderReference")}
          />
          <p id="cf-order-hint" className="text-xs text-muted-foreground">
            {F.orderHint[loc]}
          </p>
        </div>
      </div>

      <div className={field}>
        <label htmlFor="cf-message" className={label}>
          {F.message[loc]}
        </label>
        <Textarea
          id="cf-message"
          rows={7}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "cf-message-err" : undefined}
          className="rounded-xl bg-white"
          {...register("message")}
        />
        {errors.message ? (
          <p id="cf-message-err" role="alert" className={err}>
            {msg("message")}
          </p>
        ) : null}
      </div>

      {/* Honeypot: invisible to people and assistive tech, tempting to bots. */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="cf-website">Website</label>
        <input
          id="cf-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      {mutation.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-white p-4"
        >
          <p className="font-medium text-destructive">{F.errorTitle[loc]}</p>
          <p className="mt-1 text-sm text-muted-foreground">{F.errorBody[loc]}</p>
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="h-12 w-full rounded-full uppercase tracking-widest sm:w-auto sm:px-10"
      >
        {mutation.isPending ? F.sending[loc] : F.send[loc]}
      </Button>
    </form>
  );
}
