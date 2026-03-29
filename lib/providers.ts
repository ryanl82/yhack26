import { GoogleGenAI } from "@google/genai";
import { getAirportCodeForCity, getAirportCodeFromInput, getCitySeed } from "./mock-data";
import { PlannerInput, Stop, TravelRecommendation, Vibe } from "./types";
import { buildGoogleFlightsUrl, buildGoogleMapsSearchUrl, shiftDate } from "./utils";

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

type JsonInit = RequestInit & { next?: { revalidate?: number } };

async function fetchJson<T>(url: string, init?: JsonInit): Promise<T | null> {
  try {
    const response = await fetch(url, init);
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

function extractArrayDeep(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  }

  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  const directKeys = ["data", "results", "items", "flights", "hotels", "offers", "list", "response", "result", "best_flights", "properties"];
  for (const key of directKeys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
    }
  }

  for (const nested of Object.values(record)) {
    const found = extractArrayDeep(nested);
    if (found.length) return found;
  }

  return [];
}

function getValueByPath(input: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, input);
}

function readString(item: Record<string, unknown>, candidates: string[]) {
  for (const candidate of candidates) {
    const value = getValueByPath(item, candidate);
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function readNumber(item: Record<string, unknown>, candidates: string[]) {
  for (const candidate of candidates) {
    const value = getValueByPath(item, candidate);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const match = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
      if (match) return Number(match[0]);
    }
  }
  return undefined;
}

async function callRapidPost(url: string | undefined, host: string | undefined, body: Record<string, unknown>) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key || !host || !url) return null;

  return fetchJson<unknown>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": host
    },
    body: JSON.stringify(body),
    next: { revalidate: 1800 }
  });
}

function estimateNightlyBudget(input: PlannerInput, nights: number) {
  const ratio = input.stayStyle === "luxury" ? 0.34 : input.stayStyle === "budget" ? 0.18 : input.stayStyle === "boutique" ? 0.26 : 0.22;
  return Math.max(60, Math.round((input.budget * ratio) / Math.max(1, nights) / Math.max(1, input.groupSize)));
}

function mapFlightResult(item: Record<string, unknown>, input: PlannerInput, fallbackLabel: string, index: number): TravelRecommendation | null {
  const airline = readString(item, [
    "airline", "airlineName", "carrier", "carrierCode", "company.name", "legs.0.carriers.marketing.0.name",
    "segments.0.airline", "flights.0.airline", "departure_flight.0.airline", "return_flight.0.airline",
    "best_flights.0.flights.0.airline", "flights.0.name"
  ]);
  const from = readString(item, [
    "from", "origin", "originSkyId", "departureAirport.code", "fromAirport", "from_airport",
    "departure_flight.0.departure_airport.id", "best_flights.0.flights.0.departure_airport.id"
  ]) ?? getAirportCodeFromInput(input.origin);
  const to = readString(item, [
    "to", "destination", "destinationSkyId", "arrivalAirport.code", "toAirport", "to_airport",
    "departure_flight.0.arrival_airport.id", "best_flights.0.flights.0.arrival_airport.id"
  ]) ?? fallbackLabel;
  const price = readNumber(item, [
    "price", "price.total", "price.amount", "fare", "amount", "minPrice.amount", "purchaseLinks.0.price",
    "best_price", "price.raw", "total_price"
  ]);
  if (price === undefined) return null;

  const summary = readString(item, [
    "summary", "route", "itinerary", "legs.0.routeDescription", "deeplink", "bookingUrl", "duration",
    "best_flights.0.total_duration", "departure_flight.0.departure_airport.name"
  ]) ?? `Flight option from ${from} to ${to}.`;
  const exactUrl = readString(item, ["deeplink", "bookingUrl", "url", "shareUrl", "purchaseLinks.0.url", "deep_link"]);
  const url = exactUrl ?? buildGoogleFlightsUrl(from, to, input.startDate, input.endDate, input.currency ?? "USD");

  return {
    id: `flight-${readString(item, ["id", "token", "sessionId"]) ?? index}`,
    title: airline ? `${airline} ${from} → ${to}` : `${from} → ${to}`,
    category: "flight",
    price: Math.round(price),
    summary,
    url,
    source: "Live flight search",
    metadata: {
      startDate: input.startDate,
      endDate: input.endDate,
      isAlternateDate: false
    }
  };
}

function mapHotelResult(item: Record<string, unknown>, index: number): TravelRecommendation | null {
  const title = readString(item, ["name", "hotel_name", "hotelName", "property.name", "title", "accommodation_name"]);
  const price = readNumber(item, [
    "price", "price.amount", "ratePerNight.amount", "min_total_price", "compositePriceBreakdown.grossAmount.value",
    "grossPrice.value", "price_breakdown.gross_price", "price_per_night", "price.total"
  ]);
  if (!title || price === undefined) return null;

  const address = readString(item, ["address", "address_line", "address.street", "location.address", "wishlistName", "property.wishlistName", "address_trans", "city", "zip"]);
  const rating = readNumber(item, ["rating", "reviewScore", "stars", "property.reviewScore", "review_score"]);
  const url = readString(item, ["url", "deeplink", "propertyUrl", "landingUri", "hotel_url", "booking_link"])
    ?? buildGoogleMapsSearchUrl(address ? `${title} ${address}` : title);

  return {
    id: `hotel-${readString(item, ["id", "hotel_id", "hotelId", "property.id", "hotel_booking_id"]) ?? index}`,
    title,
    category: "hotel",
    price: Math.round(price),
    summary: address || "Live hotel option for your travel dates.",
    url,
    source: "Live flight search",
    rating,
    address
  };
}

function buildFallbackFlightRecommendations(input: PlannerInput): TravelRecommendation[] {
  const seed = getCitySeed(input.destination);
  const fromAirport = getAirportCodeFromInput(input.origin);
  const toAirport = getAirportCodeForCity(input.destination);
  const flexibility = Math.min(3, Math.max(0, input.dateFlexibilityDays ?? 2));

  const offsets = [0, ...Array.from({ length: flexibility }, (_, i) => i + 1)].flatMap((offset) => offset === 0 ? [0] : [offset, -offset]);

  return offsets.slice(0, 5).map((offset, index) => {
    const depart = shiftDate(input.startDate, offset);
    const ret = shiftDate(input.endDate, offset >= 0 ? Math.min(offset, 1) : 0);
    const priceDelta = offset === 0 ? 0 : offset > 0 ? -55 + index * 6 : 30 + index * 8;
    const price = Math.max(250, seed.flightBase * Math.max(1, input.groupSize) + priceDelta);
    const isAlternate = offset !== 0;
    return {
      id: `mock-flight-${index}`,
      title: `${fromAirport} → ${toAirport}`,
      category: "flight" as const,
      price,
      summary: isAlternate
        ? `Alternative date option: leave ${depart} and return ${ret}.`
        : `Round-trip option for ${depart} to ${ret}.`,
      url: buildGoogleFlightsUrl(fromAirport, toAirport, depart, ret, input.currency ?? "USD"),
      source: "Estimated option",
      metadata: {
        startDate: depart,
        endDate: ret,
        isAlternateDate: isAlternate
      }
    };
  }).sort((a, b) => a.price - b.price);
}

export async function getFlightRecommendations(input: PlannerInput): Promise<TravelRecommendation[]> {
  const fromAirport = getAirportCodeFromInput(input.origin);
  const toAirport = getAirportCodeForCity(input.destination);

  const data = await callRapidPost(
    process.env.RAPIDAPI_FLIGHTS_URL,
    process.env.RAPIDAPI_FLIGHTS_HOST,
    {
      departure_date: input.startDate,
      return_date: input.endDate,
      from_airport: fromAirport,
      to_airport: toAirport
    }
  );

  const items = extractArrayDeep(data);
  const live = items
    .map((item, index) => mapFlightResult(item, input, toAirport, index))
    .filter((item): item is TravelRecommendation => Boolean(item))
    .slice(0, 4);

  const alternates = buildFallbackFlightRecommendations(input).filter((item) => item.metadata?.isAlternateDate);
  if (live.length) return [...live, ...alternates].slice(0, 6).sort((a, b) => a.price - b.price);

  return buildFallbackFlightRecommendations(input);
}

export async function getHotelRecommendations(input: PlannerInput, _lat: number, _lng: number): Promise<TravelRecommendation[]> {
  const seed = getCitySeed(input.destination);
  const nights = Math.max(1, Math.ceil((new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000));
  const destinationLabel = [input.selectedArea, input.destinationRegion, input.destination, input.destinationCountry].filter(Boolean).join(", ");

  const data = await callRapidPost(
    process.env.RAPIDAPI_HOTELS_URL,
    process.env.RAPIDAPI_HOTELS_HOST,
    {
      destination: destinationLabel,
      checkin_date: input.startDate,
      checkout_date: input.endDate,
      adults: input.groupSize,
      children: input.children ?? 0,
      currency: input.currency ?? "USD",
      filters: input.hotelFilters?.length ? input.hotelFilters : ["free_cancellation"],
      budget_per_night: estimateNightlyBudget(input, nights)
    }
  );

  const items = extractArrayDeep(data);
  const live = items
    .map((item, index) => mapHotelResult(item, index))
    .filter((item): item is TravelRecommendation => Boolean(item))
    .slice(0, 6);

  if (live.length) return live;

  return [0, 1, 2].map((offset) => {
    const area = input.selectedArea || seed.neighborhoods[offset % seed.neighborhoods.length];
    const title = `${area} stay`;
    return {
      id: `mock-hotel-${offset}`,
      title,
      category: "hotel" as const,
      price: Math.round(seed.hotelBase * (1 + offset * 0.12)),
      summary: `Fallback stay recommendation near ${area}.`,
      source: "Estimated option",
      url: buildGoogleMapsSearchUrl(`${title} ${input.destination}`),
      address: `${area}, ${input.destination}`,
      metadata: { area }
    };
  });
}

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  editorialSummary?: { text?: string };
  primaryType?: string;
  googleMapsUri?: string;
};

type GooglePlacesResponse = { places?: GooglePlace[] };

const vibeTypeMap: Record<Vibe, string[]> = {
  food: ["restaurant", "cafe", "bakery"],
  relaxing: ["park", "spa", "botanical_garden"],
  action: ["tourist_attraction", "amusement_park", "hiking_area"],
  nightlife: ["bar", "night_club", "live_music_venue"],
  culture: ["museum", "art_gallery", "historical_place"],
  nature: ["park", "zoo", "beach"],
  shopping: ["shopping_mall", "market", "department_store"]
};

async function googlePlacesNearby(lat: number, lng: number, includedTypes: string[], maxResultCount = 8) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.editorialSummary,places.primaryType,places.googleMapsUri"
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount,
      rankPreference: "POPULARITY",
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 5000
        }
      }
    }),
    next: { revalidate: 3600 }
  });

  if (!response.ok) return null;
  return await response.json() as GooglePlacesResponse;
}

export async function getNearbyPlaces(input: PlannerInput, lat: number, lng: number) {
  const requestedTypes = Array.from(new Set(input.vibe.flatMap((vibe) => vibeTypeMap[vibe] ?? [])));
  const fallbackTypes = requestedTypes.length ? requestedTypes : ["restaurant", "tourist_attraction", "museum"];
  const data = await googlePlacesNearby(lat, lng, fallbackTypes.slice(0, 10), 12);

  if (data?.places?.length) {
    return data.places.map((place, index) => {
      const primaryType = place.primaryType ?? "tourist_attraction";
      const stopType = primaryType.includes("restaurant") || primaryType.includes("cafe") || primaryType.includes("bar")
        ? "restaurant"
        : "activity";

      const estimatedCost = stopType === "restaurant"
        ? 25 + (input.stayStyle === "luxury" ? 30 : input.stayStyle === "budget" ? 0 : 15)
        : 18 + (input.pace === "packed" ? 10 : 0);

      return {
        id: place.id ?? `place-${index}`,
        name: place.displayName?.text ?? `Place ${index + 1}`,
        type: stopType as Stop["type"],
        lat: place.location?.latitude ?? lat,
        lng: place.location?.longitude ?? lng,
        address: place.formattedAddress,
        estimatedCost,
        description: place.editorialSummary?.text || place.formattedAddress || "Real nearby place result.",
        source: "Nearby search",
        bookingUrl: place.googleMapsUri,
        rating: place.rating
      } satisfies Stop;
    });
  }

  const seed = getCitySeed(input.destination);
  return seed.activities.slice(0, 8).map((activity, index) => ({
    id: `seed-place-${index}`,
    name: activity.name,
    type: activity.type,
    lat: activity.lat ?? lat,
    lng: activity.lng ?? lng,
    estimatedCost: activity.estimatedCost,
    description: activity.description,
    source: "Seed data",
    bookingUrl: buildGoogleMapsSearchUrl(`${activity.name} ${input.destination}`)
  }));
}

export async function getEventRecommendations(input: PlannerInput, lat: number, lng: number): Promise<TravelRecommendation[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (apiKey) {
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("latlong", `${lat},${lng}`);
    url.searchParams.set("radius", "25");
    url.searchParams.set("unit", "km");
    url.searchParams.set("size", "8");
    url.searchParams.set("sort", "date,asc");
    url.searchParams.set("startDateTime", `${input.startDate}T00:00:00Z`);
    url.searchParams.set("endDateTime", `${input.endDate}T23:59:59Z`);

    const data = await fetchJson<{ _embedded?: { events?: Array<{ id: string; name: string; url?: string; priceRanges?: Array<{ min: number }>; info?: string; dates?: { start?: { localDate?: string; localTime?: string } }; _embedded?: { venues?: Array<{ name?: string; city?: { name?: string } }> } }> } }>(url.toString(), { next: { revalidate: 3600 } });

    if (data?._embedded?.events?.length) {
      return data._embedded.events.map((event) => ({
        id: `event-${event.id}`,
        title: event.name,
        category: "event",
        price: Math.round(event.priceRanges?.[0]?.min ?? 35),
        summary: `${event.dates?.start?.localDate ?? "Trip dates"}${event.dates?.start?.localTime ? ` · ${event.dates.start.localTime}` : ""}${event._embedded?.venues?.[0]?.name ? ` · ${event._embedded.venues[0].name}` : ""}${event.info ? ` — ${event.info}` : ""}`,
        url: event.url,
        source: "Ticketmaster",
        address: [event._embedded?.venues?.[0]?.name, event._embedded?.venues?.[0]?.city?.name].filter(Boolean).join(", ")
      }));
    }
  }

  return [];
}

export async function geocodeCity(destination: string) {
  const seed = getCitySeed(destination);
  const data = await fetchJson<Array<{ lat: string; lon: string; display_name: string }>>(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(destination)}`,
    { headers: { "User-Agent": "Roamly/1.0" }, next: { revalidate: 86400 } }
  );

  if (data?.[0]) {
    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      label: data[0].display_name
    };
  }

  return { lat: seed.lat, lng: seed.lng, label: seed.city };
}

export async function refinePlanWithAI(prompt: string, tripJson: string) {
  if (!gemini) {
    return "Gemini is not configured yet. Add GEMINI_API_KEY in .env.local to turn on itinerary refinement.";
  }

  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const response = await gemini.models.generateContent({
    model,
    contents: `User request: ${prompt}\n\nCurrent trip JSON:\n${tripJson}`,
    config: {
      systemInstruction:
        "You are a sharp travel planning copilot. Improve trip plans while preserving feasibility, vibe, and budget awareness. Use concise natural language and specific suggestions. Avoid duplicate itinerary spots, avoid repeating the same neighborhood when the user names areas like Myeongdong, and keep recommending fresh areas and experiences. Return plain text only.",
      temperature: 0.6
    }
  });

  return response.text ?? "No refinement was returned.";
}

export function hotelStopFromRecommendation(recommendation: TravelRecommendation, lat: number, lng: number): Stop {
  return {
    id: recommendation.id,
    name: recommendation.title,
    type: "hotel",
    lat: recommendation.lat ?? lat,
    lng: recommendation.lng ?? lng,
    estimatedCost: recommendation.price,
    description: recommendation.summary,
    source: recommendation.source,
    bookingUrl: recommendation.url,
    address: recommendation.address,
    rating: recommendation.rating
  };
}
