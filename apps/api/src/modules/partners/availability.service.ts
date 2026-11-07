import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Availability, AvailabilityDocument } from "./schemas/availability.schema";
import {
  Appointment,
  AppointmentDocument,
} from "../appointments/schemas/appointment.schema";

export interface TimeSlot {
  startsAt: string;
  endsAt: string;
  available: boolean;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
  ) {}

  async getAvailableSlots(resourceId: string, dateStr: string): Promise<TimeSlot[]> {
    const availability = await this.availabilityModel
      .findOne({
        resourceType: "partner",
        resourceId: new Types.ObjectId(resourceId),
      })
      .lean();

    if (!availability) {
      throw new NotFoundException("No availability configured for this partner.");
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new NotFoundException("Invalid date format. Use YYYY-MM-DD.");
    }

    const dayOfWeek = date.getUTCDay(); // 0=Sun..6=Sat

    // Find the day's hours
    const dayHours = availability.weeklyHours.find((wh) => wh.day === dayOfWeek);
    if (!dayHours) {
      return []; // Closed this day
    }

    // Check blocked dates
    const isBlocked = availability.blockedDates.some((bd) => {
      const blocked = new Date(bd);
      return (
        blocked.getUTCFullYear() === date.getUTCFullYear() &&
        blocked.getUTCMonth() === date.getUTCMonth() &&
        blocked.getUTCDate() === date.getUTCDate()
      );
    });
    if (isBlocked) return [];

    // Find breaks for this day
    const dayBreaks = availability.breaks.filter((b) => b.day === dayOfWeek);

    // Generate 30-min slot candidates
    const slots = this.generateSlotCandidates(dayHours.open, dayHours.close, 30);

    // Filter out break periods
    const nonBreakSlots = slots.filter((slot) => {
      return !dayBreaks.some((br) => slot.startsAt >= br.start && slot.startsAt < br.end);
    });

    // Check existing bookings for this date
    const dateStart = new Date(`${dateStr}T00:00:00.000+04:00`);
    const dateEnd = new Date(`${dateStr}T23:59:59.999+04:00`);

    const existingBookings = await this.appointmentModel
      .find({
        partnerId: new Types.ObjectId(resourceId),
        status: { $in: ["confirmed", "rescheduled"] },
        startsAt: { $gte: dateStart, $lte: dateEnd },
      })
      .lean();

    const capacity = availability.capacityPerSlot ?? 1;

    // Mark slots as available or not based on existing bookings
    return nonBreakSlots.map((slot) => {
      const slotStart = new Date(`${dateStr}T${slot.startsAt}:00.000+04:00`);
      const slotEnd = new Date(`${dateStr}T${slot.endsAt}:00.000+04:00`);

      const bookedCount = existingBookings.filter((b) => {
        const bStart = new Date(b.startsAt);
        const bEnd = new Date(b.endsAt);
        return bStart < slotEnd && bEnd > slotStart;
      }).length;

      return {
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        available: bookedCount < capacity,
      };
    });
  }

  private generateSlotCandidates(
    openTime: string,
    closeTime: string,
    durationMinutes: number,
  ): { startsAt: string; endsAt: string }[] {
    const candidates: { startsAt: string; endsAt: string }[] = [];
    const openParts = openTime.split(":").map(Number);
    const closeParts = closeTime.split(":").map(Number);
    const openH = openParts[0] ?? 0;
    const openM = openParts[1] ?? 0;
    const closeH = closeParts[0] ?? 0;
    const closeM = closeParts[1] ?? 0;

    let currentMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    while (currentMinutes + durationMinutes <= closeMinutes) {
      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const endMinutes = currentMinutes + durationMinutes;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;

      candidates.push({
        startsAt: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
        endsAt: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
      });

      currentMinutes += durationMinutes;
    }

    return candidates;
  }

  async getAvailabilityForPartner(partnerId: string) {
    return this.availabilityModel
      .findOne({
        resourceType: "partner",
        resourceId: new Types.ObjectId(partnerId),
      })
      .lean();
  }
}
