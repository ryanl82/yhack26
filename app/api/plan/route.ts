import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTrip } from "@/lib/planner";

const stopSchema = z.object({
  destination: z.string().min(2),
  destinationCountry: z.string().optional(),
  destinationRegion: z.string().optional(),
  selectedArea: z.string().optional(),
  startDate: z.string().min(10),
  endDate: z.string().min(10)
});

const schema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  destinationCountry: z.string().optional(),
  destinationRegion: z.string().optional(),
  selectedArea: z.string().optional(),
  startDate: z.string().min(10),
  endDate: z.string().min(10),
  tripType: z.enum(["single", "multi"]).optional(),
  tripStops: z.array(stopSchema).optional(),
  budget: z.coerce.number().positive(),
  groupSize: z.coerce.number().int().positive(),
  children: z.coerce.number().int().min(0).optional(),
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "KRW", "SGD", "THB"]).optional(),
  hotelFilters: z.array(z.string()).optional(),
  vibe: z.array(z.enum(["food", "relaxing", "action", "nightlife", "culture", "nature", "shopping"])) .default([]),
  customVibes: z.array(z.string()).optional(),
  pace: z.enum(["easy", "balanced", "packed"]).optional(),
  stayStyle: z.enum(["budget", "boutique", "comfort", "luxury"]).optional(),
  notes: z.string().optional(),
  travelerLat: z.number().optional(),
  travelerLng: z.number().optional(),
  useCurrentLocation: z.boolean().optional(),
  dateFlexibilityDays: z.coerce.number().int().min(0).max(3).optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const trip = await generateTrip(parsed);
    return NextResponse.json({ trip });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to build trip." }, { status: 400 });
  }
}
