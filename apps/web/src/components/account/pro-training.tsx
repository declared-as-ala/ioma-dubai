"use client";
import { CertificateLink } from "./certificate-link";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import {
  useTrainings,
  useTrainingSessions,
  useMyTrainingBookings,
  useBookTrainingSessionMutation,
  useCancelTrainingBookingMutation,
  type TrainingCourse,
} from "@/hooks/use-trainings";
import { Button } from "@/components/ui/button";
import { AccountHeading, AccountSection, QueryState } from "./experience-ui";
function Course({ course }: { course: TrainingCourse }) {
  const t = useTranslations("Pro.trainings");
  const a = useTranslations("AccountExperience");
  const locale = useLocale() as Locale;
  const q = useTrainingSessions(course._id);
  const bookings = useMyTrainingBookings();
  const book = useBookTrainingSessionMutation();
  return (
    <article className="border-t border-border py-8">
      <h2 className="text-2xl font-light">{course.name[locale]}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {course.description[locale]}
      </p>
      <p className="my-4 text-xs">{t(course.mode)}</p>
      <QueryState query={q}>
        {q.data?.length ? (
          q.data.map((s) => {
            const booked = bookings.data?.some(
              (b) => b.sessionId === s._id && b.status === "booked",
            );
            return (
              <div
                key={s._id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5"
              >
                <div>
                  <p className="text-sm">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Dubai",
                    }).format(new Date(s.startsAt))}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {s.location ?? t("online")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  disabled={
                    book.isPending ||
                    booked ||
                    s.seatsBooked >= s.capacity ||
                    new Date(s.startsAt) < new Date()
                  }
                  onClick={() => book.mutate(s._id)}
                >
                  {t(
                    booked
                      ? "booked"
                      : s.seatsBooked >= s.capacity
                        ? "fullyBooked"
                        : "bookSession",
                  )}
                </Button>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">{t("noSessions")}</p>
        )}
      </QueryState>
      {book.isError && (
        <p role="alert" className="mt-3 text-destructive">
          {a("error")}
        </p>
      )}
    </article>
  );
}
export default function ProfessionalTraining() {
  const t = useTranslations("Pro.trainings");
  const a = useTranslations("AccountExperience");
  const locale = useLocale();
  const q = useTrainings();
  const bookings = useMyTrainingBookings();
  const cancel = useCancelTrainingBookingMutation();
  return (
    <>
      <AccountHeading title={a("training")} description={t("subtitle")} />
      <AccountSection title={t("myBookings")}>
        <QueryState query={bookings}>
          {bookings.data?.length ? (
            bookings.data.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5"
              >
                <div>
                  <p className="text-sm">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Dubai",
                    }).format(new Date(b.startsAt))}
                  </p>
                  <p className="mt-2 text-xs">
                    {t(`statuses.${b.status}`)} · {b.location}
                  </p>
                </div>
                {b.certificateAvailable && <CertificateLink id={b.id} />}{" "}
                {b.status === "booked" && (
                  <Button
                    variant="outline"
                    disabled={cancel.isPending}
                    onClick={() =>
                      window.confirm(t("confirmCancel")) && cancel.mutate(b.id)
                    }
                  >
                    {t("cancelBooking")}
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{a("noTraining")}</p>
          )}
        </QueryState>
        {cancel.isError && <p role="alert">{a("error")}</p>}
      </AccountSection>
      <QueryState query={q}>
        {q.data?.map((course) => (
          <Course key={course._id} course={course} />
        ))}
        {!q.data?.length && <p>{t("noSessions")}</p>}
      </QueryState>
    </>
  );
}
