import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface MyAppointment {
  id: string;
  partner: { slug: string; name: string; city: string };
  service: { slug: string; name: Record<string, string>; durationMinutes: number };
  startsAt: string;
  endsAt: string;
  status: string;
  notes?: string | null;
}

const KEY = ["appointments", "mine"] as const;

export function useMyAppointmentsQuery() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<MyAppointment[]>("/appointments/me"),
  });
}

export function useCancelAppointmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/appointments/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
