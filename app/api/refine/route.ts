import { NextResponse } from "next/server";
import { z } from "zod";
import { refinePlanWithAI } from "@/lib/providers";

const schema = z.object({
  prompt: z.string().min(2),
  trip: z.unknown()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const suggestion = await refinePlanWithAI(parsed.prompt, JSON.stringify(parsed.trip));
    return NextResponse.json({ suggestion });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to refine trip." }, { status: 400 });
  }
}
