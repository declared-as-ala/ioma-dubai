"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminAccess } from "@/hooks/use-admin";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input, Select } from "./polaris";
import { AdminQueryState } from "./admin-ui";

interface Contact {
  name: string;
  phone: string;
  email: string;
}
interface Settings {
  minFirstOrderMinor: number;
  unlockOn: "confirmed" | "paid";
  validMonths: number | null;
  teamEmail: string;
  teamContact: Contact;
  defaultAccountContact: Contact;
}
const blank: Contact = { name: "", phone: "", email: "" };

function ContactFields({
  prefix,
  value,
  onChange,
  disabled,
}: {
  prefix: string;
  value: Contact;
  onChange: (c: Contact) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Name" htmlFor={`${prefix}-name`}>
        <Input
          id={`${prefix}-name`}
          value={value.name}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </Field>
      <Field label="Phone" htmlFor={`${prefix}-phone`}>
        <Input
          id={`${prefix}-phone`}
          dir="ltr"
          value={value.phone}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
        />
      </Field>
      <Field label="Email" htmlFor={`${prefix}-email`}>
        <Input
          id={`${prefix}-email`}
          type="email"
          dir="ltr"
          value={value.email}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />
      </Field>
    </div>
  );
}

export function AdminB2bSettings() {
  const qc = useQueryClient();
  const access = useAdminAccess();
  const manage = !!access.data?.permissions.includes("b2b.manage");
  const query = useQuery({
    queryKey: ["admin", "b2b-settings"],
    queryFn: () => apiFetch<Settings>("/professional/admin/b2b-settings"),
  });

  const [minAed, setMinAed] = useState("0");
  const [unlockOn, setUnlockOn] = useState<"confirmed" | "paid">("confirmed");
  const [validity, setValidity] = useState<"life" | "months">("life");
  const [months, setMonths] = useState("12");
  const [teamEmail, setTeamEmail] = useState("");
  const [team, setTeam] = useState<Contact>(blank);
  const [dflt, setDflt] = useState<Contact>(blank);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    const s = query.data;
    if (!s) return;
    setMinAed(String(s.minFirstOrderMinor / 100));
    setUnlockOn(s.unlockOn);
    setValidity(s.validMonths ? "months" : "life");
    setMonths(String(s.validMonths ?? 12));
    setTeamEmail(s.teamEmail ?? "");
    setTeam({ ...blank, ...s.teamContact });
    setDflt({ ...blank, ...s.defaultAccountContact });
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch("/professional/admin/b2b-settings", {
        method: "PATCH",
        body: JSON.stringify({
          minFirstOrderAed: Number(minAed) || 0,
          unlockOn,
          validMonths:
            validity === "life"
              ? null
              : Math.max(1, Math.min(60, Math.round(Number(months) || 12))),
          teamEmail: teamEmail.trim(),
          teamContact: team,
          defaultAccountContact: dflt,
        }),
      }),
    onSuccess: () => {
      setMsg({
        kind: "ok",
        text: "Settings saved. They apply immediately to every account.",
      });
      qc.invalidateQueries({ queryKey: ["admin", "b2b-settings"] });
    },
    onError: (e) =>
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Could not save." }),
  });

  return (
    <div className="mx-auto max-w-[900px] space-y-4">
      <div className="min-w-0">
        <h1 className="pl-page-title">B2B settings</h1>
        <p className="pl-help !mt-0">
          The first-order rule and the contacts shown in the pro space. To confirm with
          IEVA.
        </p>
      </div>
      <AdminQueryState query={query}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            save.mutate();
          }}
        >
          {msg && (
            <p
              role={msg.kind === "error" ? "alert" : "status"}
              className="pl-card !p-3 text-[13px]"
              style={{
                color: msg.kind === "error" ? "var(--pl-critical)" : "var(--pl-success)",
              }}
            >
              {msg.text}
            </p>
          )}
          <Card title="First-order rule">
            <p className="pl-help !mt-0 mb-4">
              An account becomes a customer, and the training videos, cabin gallery and
              benefits unlock, when an order meets this rule. The access level is
              recalculated from the orders, so a cancelled or refunded order closes it
              again.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Minimum first order (AED)"
                htmlFor="min"
                help="0 = no minimum."
              >
                <Input
                  id="min"
                  inputMode="decimal"
                  value={minAed}
                  disabled={!manage}
                  onChange={(e) => setMinAed(e.target.value)}
                />
              </Field>
              <Field
                label="Unlock when the order is"
                htmlFor="unlock"
                help="Recommended: confirmed or paid, never just placed."
              >
                <Select
                  id="unlock"
                  value={unlockOn}
                  disabled={!manage}
                  onChange={(e) => setUnlockOn(e.target.value as "confirmed" | "paid")}
                >
                  <option value="confirmed">
                    Confirmed (authorised, paid or in preparation)
                  </option>
                  <option value="paid">Paid</option>
                </Select>
              </Field>
              <Field label="Benefits last" htmlFor="validity">
                <Select
                  id="validity"
                  value={validity}
                  disabled={!manage}
                  onChange={(e) => setValidity(e.target.value as "life" | "months")}
                >
                  <option value="life">For life</option>
                  <option value="months">
                    A number of months after the latest order
                  </option>
                </Select>
              </Field>
              {validity === "months" && (
                <Field
                  label="Months"
                  htmlFor="months"
                  help="A new qualifying order is needed within this period to keep the benefits."
                >
                  <Input
                    id="months"
                    inputMode="numeric"
                    value={months}
                    disabled={!manage}
                    onChange={(e) => setMonths(e.target.value)}
                  />
                </Field>
              )}
            </div>
          </Card>
          <Card title="Registration notifications">
            <Field
              label="Send new registrations to"
              htmlFor="team-email"
              help="Leave empty to use the server default (B2B_TEAM_EMAIL or the sender address)."
            >
              <Input
                id="team-email"
                type="email"
                dir="ltr"
                value={teamEmail}
                disabled={!manage}
                onChange={(e) => setTeamEmail(e.target.value)}
              />
            </Field>
          </Card>
          <Card title="Need help? contact (IOMA Pro team)">
            <ContactFields
              prefix="team"
              value={team}
              onChange={setTeam}
              disabled={!manage}
            />
          </Card>
          <Card title="Default dedicated contact (customers)">
            <p className="pl-help !mt-0 mb-3">
              Used for customers who have no personal contact assigned on their lead.
            </p>
            <ContactFields
              prefix="default"
              value={dflt}
              onChange={setDflt}
              disabled={!manage}
            />
          </Card>
          {manage && (
            <Button type="submit" variant="primary" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save settings"}
            </Button>
          )}
        </form>
      </AdminQueryState>
    </div>
  );
}
