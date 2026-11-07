import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface TrainingCourse {
  _id: string;
  slug: string;
  name: { en: string; fr: string; ar: string };
  description: { en: string; fr: string; ar: string };
  mode: "online" | "physical";
  requiredLevel: string;
  includedMaterials: string[];
}

export interface TrainingSessionItem {
  _id: string;
  trainingId: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  capacity: number;
  seatsBooked: number;
  priceMinor: number | null;
}

export interface TrainingBookingItem {
  certificateAvailable?: boolean;
  id: string;
  sessionId: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  status: "booked" | "cancelled" | "attended" | "no_show";
}

export function useTrainings() {
  return useQuery({
    queryKey: ["trainings"],
    queryFn: () => apiFetch<TrainingCourse[]>("/trainings"),
  });
}

export function useTrainingSessions(trainingId: string) {
  return useQuery({
    queryKey: ["training-sessions", trainingId],
    queryFn: () => apiFetch<TrainingSessionItem[]>(`/trainings/${trainingId}/sessions`),
    enabled: !!trainingId,
  });
}

export function useMyTrainingBookings() {
  return useQuery({
    queryKey: ["my-training-bookings"],
    queryFn: () => apiFetch<TrainingBookingItem[]>("/trainings/my-bookings"),
  });
}

export function useBookTrainingSessionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<{ id: string; status: string }>(`/trainings/sessions/${sessionId}/book`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-training-bookings"] });
      qc.invalidateQueries({ queryKey: ["training-sessions"] });
    },
  });
}

export function useCancelTrainingBookingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      apiFetch<{ id: string; status: string }>(
        `/trainings/my-bookings/${bookingId}/cancel`,
        {
          method: "PATCH",
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-training-bookings"] });
      qc.invalidateQueries({ queryKey: ["training-sessions"] });
    },
  });
}
