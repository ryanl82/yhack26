import { GeneratedTrip, Stop, TravelMode, TravelRecommendation, Vibe } from "./types";

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function dateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function shiftDate(date: string, offsetDays: number) {
  const shifted = new Date(`${date}T00:00:00`);
  shifted.setDate(shifted.getDate() + offsetDays);
  return shifted.toISOString().slice(0, 10);
}

export function getTripLength(startDate: string, endDate: string) {
  return Math.max(1, dateRange(startDate, endDate).length);
}

export function encodeTrip(trip: GeneratedTrip) {
  return Buffer.from(JSON.stringify(trip), "utf8").toString("base64url");
}

export function decodeTrip(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as GeneratedTrip;
}

export function nearestNeighborRoute<T extends { lat: number; lng: number }>(items: T[]) {
  if (items.length <= 2) return items;
  const remaining = [...items];
  const ordered: T[] = [remaining.shift() as T];

  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let bestIndex = 0;
    let bestDistance = Infinity;

    remaining.forEach((item, index) => {
      const distance = geoDistance(last.lat, last.lng, item.lat, item.lng);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    ordered.push(remaining.splice(bestIndex, 1)[0]);
  }

  return ordered;
}

export function geoDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateTravelMode(distanceKm: number): TravelMode {
  return distanceKm <= 2.2 ? "walk" : "drive";
}

export function estimateTravelMinutes(distanceKm: number, mode?: TravelMode) {
  const resolvedMode = mode ?? estimateTravelMode(distanceKm);
  const speedKmH = resolvedMode === "walk" ? 4.8 : 28;
  return Math.max(3, Math.round((distanceKm / speedKmH) * 60));
}

const vibeThemes: Record<Vibe, string[]> = {
  food: ["signature food crawl", "chef-driven dinner block", "market-to-table day"],
  relaxing: ["slow morning + scenic walk", "spa and sunset day", "easy cafe and garden day"],
  action: ["high-energy adventure run", "bike + climb + late snack", "full-day motion plan"],
  nightlife: ["cocktails and live music", "late-night neighborhood circuit", "rooftop + social plan"],
  culture: ["museum and history corridor", "gallery + architecture day", "local culture immersion"],
  nature: ["coastal or garden route", "parks and views day", "outdoor reset day"],
  shopping: ["shopping district afternoon", "markets and design stores", "retail and cafe route"]
};

export function pickThemes(vibes: Vibe[], customVibes: string[] = [], days: number) {
  const pool = [
    ...vibes.flatMap((v) => vibeThemes[v]),
    ...customVibes.map((item) => `${item} day`)
  ];
  if (!pool.length) pool.push("balanced exploration day");
  return Array.from({ length: days }, (_, i) => pool[i % pool.length]);
}

export function uniqueRecommendations(items: TravelRecommendation[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.category}-${item.title}-${item.metadata?.startDate ?? ""}-${item.metadata?.endDate ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function flattenStops(days: GeneratedTrip["days"]) {
  return days.flatMap((day) => day.stops);
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function shareUrlFromId(id: string) {
  return `/trip/${id}`;
}

export function destinationImage(destination: string) {
  const slug = slugify(destination);
  const presets: Record<string, string> = {
    tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
    seoul: "https://images.unsplash.com/photo-1538485399081-7c897c5f5528?auto=format&fit=crop&w=1200&q=80",
    bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80",
    singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
    paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
    london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
    barcelona: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80",
    lisbon: "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1200&q=80",
    dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80",
    "new-york": "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=1200&q=80",
    "mexico-city": "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1200&q=80",
    "cape-town": "https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=1200&q=80"
  };
  return presets[slug] ?? "https://images.unsplash.com/photo-1502920917128-1aa500764ce7?auto=format&fit=crop&w=1200&q=80";
}

export function buildGoogleFlightsUrl(from: string, to: string, startDate: string, endDate: string, currency = "USD") {
  const safeFrom = encodeURIComponent(from.toUpperCase());
  const safeTo = encodeURIComponent(to.toUpperCase());
  return `https://www.google.com/travel/flights?curr=${encodeURIComponent(currency)}#flt=${safeFrom}.${safeTo}.${startDate}*${safeTo}.${safeFrom}.${endDate}`;
}

export function buildGoogleMapsDirectionsUrl(fromLat: number, fromLng: number, toLat: number, toLng: number, mode: TravelMode) {
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=${mode}`;
}

export function buildGoogleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
