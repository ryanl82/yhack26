import { Stop, Vibe } from "./types";

export type CitySeed = {
  city: string;
  country: string;
  code: string;
  lat: number;
  lng: number;
  hotelBase: number;
  flightBase: number;
  neighborhoods: string[];
  activities: Array<Omit<Stop, "id" | "type"> & { vibe: Vibe[]; type: Stop["type"] }>;
};

export const citySeeds: CitySeed[] = [
  {
    city: "Tokyo",
    country: "Japan",
    code: "TYO",
    lat: 35.6762,
    lng: 139.6503,
    hotelBase: 205,
    flightBase: 960,
    neighborhoods: ["Shibuya", "Asakusa", "Shinjuku", "Ginza", "Daikanyama"],
    activities: [
      { name: "Shibuya food alley tour", lat: 35.6595, lng: 139.7005, estimatedCost: 48, description: "Local bites and izakaya stops.", vibe: ["food", "nightlife"], type: "restaurant" },
      { name: "Meiji Shrine & Yoyogi walk", lat: 35.6764, lng: 139.6993, estimatedCost: 10, description: "Relaxed green route with culture stops.", vibe: ["relaxing", "culture"], type: "activity" },
      { name: "teamLab-style digital art stop", lat: 35.6498, lng: 139.7898, estimatedCost: 35, description: "Immersive art and visuals.", vibe: ["culture", "action"], type: "activity" },
      { name: "Tsukiji breakfast circuit", lat: 35.6655, lng: 139.7708, estimatedCost: 30, description: "Seafood and market breakfast crawl.", vibe: ["food"], type: "restaurant" },
      { name: "Golden Gai live music night", lat: 35.694, lng: 139.7043, estimatedCost: 42, description: "Compact nightlife district.", vibe: ["nightlife"], type: "activity" }
    ]
  },
  {
    city: "Kyoto",
    country: "Japan",
    code: "KIX",
    lat: 35.0116,
    lng: 135.7681,
    hotelBase: 185,
    flightBase: 980,
    neighborhoods: ["Gion", "Higashiyama", "Arashiyama", "Downtown Kyoto", "Fushimi"],
    activities: [
      { name: "Temple and tea morning", lat: 35.0037, lng: 135.7788, estimatedCost: 22, description: "Quiet temple route with tea stop.", vibe: ["relaxing", "culture"], type: "activity" },
      { name: "Arashiyama bamboo walk", lat: 35.017, lng: 135.6713, estimatedCost: 14, description: "Nature-forward half day.", vibe: ["nature", "relaxing"], type: "activity" },
      { name: "Kaiseki dinner booking", lat: 35.0038, lng: 135.7755, estimatedCost: 70, description: "Seasonal tasting dinner.", vibe: ["food", "culture"], type: "restaurant" },
      { name: "Nishiki market tasting route", lat: 35.005, lng: 135.764, estimatedCost: 34, description: "Small bites and local specialties.", vibe: ["food"], type: "restaurant" }
    ]
  },
  {
    city: "Seoul",
    country: "South Korea",
    code: "SEL",
    lat: 37.5665,
    lng: 126.978,
    hotelBase: 180,
    flightBase: 910,
    neighborhoods: ["Myeongdong", "Hongdae", "Insadong", "Gangnam", "Seongsu"],
    activities: [
      { name: "Street food night market", lat: 37.5637, lng: 126.985, estimatedCost: 24, description: "Easy grazing route.", vibe: ["food", "nightlife"], type: "restaurant" },
      { name: "Palace + hanok day", lat: 37.5796, lng: 126.977, estimatedCost: 18, description: "Classic city culture day.", vibe: ["culture"], type: "activity" },
      { name: "River park bike ride", lat: 37.5283, lng: 126.932, estimatedCost: 12, description: "Scenic active afternoon.", vibe: ["action", "relaxing"], type: "activity" },
      { name: "Seongsu cafe circuit", lat: 37.5445, lng: 127.0557, estimatedCost: 28, description: "Design-forward cafe hopping.", vibe: ["food", "shopping"], type: "restaurant" }
    ]
  },
  {
    city: "Bangkok",
    country: "Thailand",
    code: "BKK",
    lat: 13.7563,
    lng: 100.5018,
    hotelBase: 110,
    flightBase: 890,
    neighborhoods: ["Sukhumvit", "Old Town", "Sathorn", "Ari", "Silom"],
    activities: [
      { name: "Canal and temple route", lat: 13.7525, lng: 100.493, estimatedCost: 15, description: "A classic first-day route.", vibe: ["culture", "relaxing"], type: "activity" },
      { name: "Night market dinner crawl", lat: 13.7207, lng: 100.5252, estimatedCost: 26, description: "Street food and live stalls.", vibe: ["food", "nightlife"], type: "restaurant" },
      { name: "Rooftop evening", lat: 13.7234, lng: 100.5301, estimatedCost: 36, description: "Skyline drinks and late dinner.", vibe: ["nightlife"], type: "activity" },
      { name: "Floating market day trip", lat: 13.7145, lng: 100.4149, estimatedCost: 30, description: "Half-day outside the core.", vibe: ["action", "food"], type: "activity" }
    ]
  },
  {
    city: "Singapore",
    country: "Singapore",
    code: "SIN",
    lat: 1.3521,
    lng: 103.8198,
    hotelBase: 230,
    flightBase: 980,
    neighborhoods: ["Marina Bay", "Tiong Bahru", "Chinatown", "Kampong Glam", "Sentosa"],
    activities: [
      { name: "Hawker center tasting run", lat: 1.2803, lng: 103.8448, estimatedCost: 22, description: "Affordable iconic food day.", vibe: ["food"], type: "restaurant" },
      { name: "Gardens by the Bay evening", lat: 1.2816, lng: 103.8636, estimatedCost: 26, description: "Easy scenic evening.", vibe: ["relaxing", "nature"], type: "activity" },
      { name: "Sentosa beach + attractions", lat: 1.2494, lng: 103.8303, estimatedCost: 40, description: "More active day with attractions.", vibe: ["action"], type: "activity" }
    ]
  },
  {
    city: "Paris",
    country: "France",
    code: "PAR",
    lat: 48.8566,
    lng: 2.3522,
    hotelBase: 240,
    flightBase: 880,
    neighborhoods: ["Le Marais", "Saint-Germain", "Montmartre", "Latin Quarter", "Canal Saint-Martin"],
    activities: [
      { name: "Left Bank cafe hop", lat: 48.8527, lng: 2.332, estimatedCost: 36, description: "Coffee, pastries, and street views.", vibe: ["food", "relaxing"], type: "restaurant" },
      { name: "Louvre priority visit", lat: 48.8606, lng: 2.3376, estimatedCost: 32, description: "Classic art anchor stop.", vibe: ["culture"], type: "activity" },
      { name: "Seine sunset cruise", lat: 48.8584, lng: 2.2945, estimatedCost: 28, description: "Low-stress scenic evening.", vibe: ["relaxing"], type: "activity" },
      { name: "Montmartre neighborhood climb", lat: 48.8867, lng: 2.3431, estimatedCost: 18, description: "Views, stairs, and artist lanes.", vibe: ["action", "culture"], type: "activity" },
      { name: "Late dinner wine bar", lat: 48.8645, lng: 2.3635, estimatedCost: 52, description: "Lively late-night dinner block.", vibe: ["nightlife", "food"], type: "restaurant" }
    ]
  },
  {
    city: "Rome",
    country: "Italy",
    code: "ROM",
    lat: 41.9028,
    lng: 12.4964,
    hotelBase: 210,
    flightBase: 860,
    neighborhoods: ["Trastevere", "Centro Storico", "Monti", "Prati", "Testaccio"],
    activities: [
      { name: "Pasta and piazza evening", lat: 41.8897, lng: 12.4697, estimatedCost: 42, description: "Crowd-favorite dinner zone.", vibe: ["food", "nightlife"], type: "restaurant" },
      { name: "Ancient Rome corridor", lat: 41.8902, lng: 12.4922, estimatedCost: 30, description: "Classic landmark day.", vibe: ["culture"], type: "activity" },
      { name: "Villa Borghese slow afternoon", lat: 41.9142, lng: 12.4923, estimatedCost: 12, description: "Easy afternoon in the park.", vibe: ["relaxing", "nature"], type: "activity" }
    ]
  },
  {
    city: "Barcelona",
    country: "Spain",
    code: "BCN",
    lat: 41.3874,
    lng: 2.1686,
    hotelBase: 185,
    flightBase: 790,
    neighborhoods: ["El Born", "Gothic Quarter", "Eixample", "Gracia", "Barceloneta"],
    activities: [
      { name: "Tapas + vermouth crawl", lat: 41.3851, lng: 2.1814, estimatedCost: 44, description: "Dense food route through old town.", vibe: ["food", "nightlife"], type: "restaurant" },
      { name: "Beach and boardwalk reset", lat: 41.3764, lng: 2.1925, estimatedCost: 16, description: "Easy coastal day.", vibe: ["relaxing"], type: "activity" },
      { name: "Gaudí architecture route", lat: 41.4036, lng: 2.1744, estimatedCost: 34, description: "Iconic buildings and design stops.", vibe: ["culture"], type: "activity" },
      { name: "Bunkers viewpoint hike", lat: 41.4182, lng: 2.1527, estimatedCost: 12, description: "Scenic uphill route.", vibe: ["action", "relaxing"], type: "activity" },
      { name: "El Born jazz night", lat: 41.3857, lng: 2.1802, estimatedCost: 30, description: "Night set in central district.", vibe: ["nightlife"], type: "activity" }
    ]
  },
  {
    city: "London",
    country: "United Kingdom",
    code: "LON",
    lat: 51.5072,
    lng: -0.1276,
    hotelBase: 260,
    flightBase: 760,
    neighborhoods: ["Soho", "Covent Garden", "Notting Hill", "Shoreditch", "South Bank"],
    activities: [
      { name: "West End night out", lat: 51.5136, lng: -0.129, estimatedCost: 65, description: "Show plus dinner zone.", vibe: ["nightlife", "culture"], type: "activity" },
      { name: "Museum and park pairing", lat: 51.4966, lng: -0.1722, estimatedCost: 18, description: "A calm high-value day.", vibe: ["culture", "relaxing"], type: "activity" },
      { name: "Borough Market lunch", lat: 51.5055, lng: -0.0909, estimatedCost: 28, description: "Strong food-first stop.", vibe: ["food"], type: "restaurant" },
      { name: "Carnaby and Regent shopping stretch", lat: 51.5139, lng: -0.1394, estimatedCost: 22, description: "Style and shopping route.", vibe: ["shopping"], type: "activity" }
    ]
  },
  {
    city: "Lisbon",
    country: "Portugal",
    code: "LIS",
    lat: 38.7223,
    lng: -9.1393,
    hotelBase: 155,
    flightBase: 720,
    neighborhoods: ["Alfama", "Baixa", "Chiado", "Bairro Alto", "Belém"],
    activities: [
      { name: "Tram and miradouro route", lat: 38.7139, lng: -9.1335, estimatedCost: 14, description: "Iconic first day with viewpoints.", vibe: ["relaxing", "culture"], type: "activity" },
      { name: "Pastel + seafood crawl", lat: 38.7077, lng: -9.1366, estimatedCost: 34, description: "Food-heavy downtown route.", vibe: ["food"], type: "restaurant" },
      { name: "Fado evening", lat: 38.711, lng: -9.1291, estimatedCost: 28, description: "Music-led night plan.", vibe: ["nightlife", "culture"], type: "activity" }
    ]
  },
  {
    city: "New York",
    country: "United States",
    code: "NYC",
    lat: 40.7128,
    lng: -74.006,
    hotelBase: 290,
    flightBase: 420,
    neighborhoods: ["SoHo", "West Village", "Midtown", "Williamsburg", "Upper West Side"],
    activities: [
      { name: "Downtown food walk", lat: 40.7195, lng: -73.997, estimatedCost: 40, description: "Dense restaurant route.", vibe: ["food"], type: "restaurant" },
      { name: "Museum Mile + Central Park", lat: 40.7813, lng: -73.9735, estimatedCost: 26, description: "Classic low-friction day.", vibe: ["culture", "relaxing"], type: "activity" },
      { name: "Broadway night", lat: 40.758, lng: -73.9855, estimatedCost: 80, description: "Main evening anchor.", vibe: ["nightlife", "culture"], type: "activity" },
      { name: "Brooklyn waterfront route", lat: 40.7033, lng: -73.995, estimatedCost: 16, description: "Views and walking-heavy route.", vibe: ["action", "relaxing"], type: "activity" }
    ]
  },
  {
    city: "Mexico City",
    country: "Mexico",
    code: "MEX",
    lat: 19.4326,
    lng: -99.1332,
    hotelBase: 130,
    flightBase: 520,
    neighborhoods: ["Roma Norte", "Condesa", "Centro Histórico", "Polanco", "Coyoacán"],
    activities: [
      { name: "Taco route in Roma", lat: 19.4146, lng: -99.1677, estimatedCost: 18, description: "High-return food stop.", vibe: ["food"], type: "restaurant" },
      { name: "Museums and parks day", lat: 19.426, lng: -99.181, estimatedCost: 20, description: "Easy full afternoon.", vibe: ["culture", "relaxing"], type: "activity" },
      { name: "Lucha libre night", lat: 19.4294, lng: -99.1321, estimatedCost: 24, description: "Fun local night option.", vibe: ["nightlife", "action"], type: "activity" }
    ]
  },
  {
    city: "Dubai",
    country: "United Arab Emirates",
    code: "DXB",
    lat: 25.2048,
    lng: 55.2708,
    hotelBase: 240,
    flightBase: 980,
    neighborhoods: ["Downtown", "Dubai Marina", "Jumeirah", "Deira", "Al Seef"],
    activities: [
      { name: "Desert safari afternoon", lat: 25.1032, lng: 55.3285, estimatedCost: 58, description: "Adventure-forward day.", vibe: ["action"], type: "activity" },
      { name: "Old Dubai souk route", lat: 25.2669, lng: 55.2962, estimatedCost: 20, description: "Markets and local history.", vibe: ["shopping", "culture"], type: "activity" },
      { name: "Skyline dinner", lat: 25.1972, lng: 55.2744, estimatedCost: 68, description: "Dinner with a major view.", vibe: ["food", "nightlife"], type: "restaurant" }
    ]
  },
  {
    city: "Sydney",
    country: "Australia",
    code: "SYD",
    lat: -33.8688,
    lng: 151.2093,
    hotelBase: 220,
    flightBase: 1250,
    neighborhoods: ["CBD", "Surry Hills", "Bondi", "The Rocks", "Newtown"],
    activities: [
      { name: "Coastal walk at Bondi", lat: -33.8915, lng: 151.2767, estimatedCost: 12, description: "Nature-forward and active.", vibe: ["nature", "action"], type: "activity" },
      { name: "Harbour evening cruise", lat: -33.8568, lng: 151.2153, estimatedCost: 38, description: "Relaxed scenic anchor.", vibe: ["relaxing"], type: "activity" },
      { name: "Surry Hills brunch run", lat: -33.8832, lng: 151.2094, estimatedCost: 28, description: "Food-led neighborhood route.", vibe: ["food"], type: "restaurant" }
    ]
  },
  {
    city: "Cape Town",
    country: "South Africa",
    code: "CPT",
    lat: -33.9249,
    lng: 18.4241,
    hotelBase: 160,
    flightBase: 1180,
    neighborhoods: ["City Bowl", "Camps Bay", "Sea Point", "Woodstock", "Waterfront"],
    activities: [
      { name: "Table Mountain day", lat: -33.9628, lng: 18.4098, estimatedCost: 26, description: "Core active experience.", vibe: ["action", "nature"], type: "activity" },
      { name: "Winelands tasting route", lat: -33.9321, lng: 18.8602, estimatedCost: 44, description: "Relaxed half-day out of town.", vibe: ["food", "relaxing"], type: "activity" },
      { name: "Waterfront sunset dinner", lat: -33.9031, lng: 18.4207, estimatedCost: 40, description: "Easy evening plan.", vibe: ["food", "nightlife"], type: "restaurant" }
    ]
  }
];

export function getCitySeed(destination: string) {
  const lower = destination.trim().toLowerCase();
  return citySeeds.find((city) => city.city.toLowerCase() === lower) ?? citySeeds[0];
}

export function getCountries() {
  return Array.from(new Set(citySeeds.map((city) => city.country))).sort();
}

export function getCitiesByCountry(country?: string) {
  return Array.from(new Set(citySeeds.filter((city) => !country || city.country === country).map((city) => city.city))).sort();
}

export function getRegionsByCountry(country?: string) {
  return Array.from(new Set(
    citySeeds
      .filter((city) => !country || city.country === country)
      .flatMap((city) => [city.city, ...city.neighborhoods])
  )).sort();
}

export function getAreas(country?: string, city?: string) {
  return Array.from(new Set(
    citySeeds
      .filter((item) => (!country || item.country === country) && (!city || item.city === city))
      .flatMap((item) => item.neighborhoods)
  )).sort();
}


const airportCodeMap: Record<string, string> = {
  TYO: "HND", KIX: "KIX", SEL: "ICN", BKK: "BKK", SIN: "SIN", PAR: "CDG", ROM: "FCO", BCN: "BCN",
  LON: "LHR", LIS: "LIS", AMS: "AMS", BER: "BER", PRG: "PRG", IST: "IST", DXB: "DXB", CPT: "CPT",
  SYD: "SYD", MEX: "MEX", LAX: "LAX", NYC: "JFK", YVR: "YVR", RIO: "GIG", BUE: "EZE", CAI: "CAI"
};

const airportAliases: Record<string, string> = {
  jfk: "JFK", newyork: "JFK", nyc: "JFK", laguardia: "LGA", lga: "LGA", newark: "EWR", ewr: "EWR",
  boston: "BOS", bos: "BOS", london: "LHR", heathrow: "LHR", lhr: "LHR", gatwick: "LGW", lgw: "LGW",
  paris: "CDG", cdg: "CDG", orly: "ORY", ory: "ORY", tokyo: "HND", hnd: "HND", narita: "NRT", nrt: "NRT",
  seoul: "ICN", icn: "ICN", bangkok: "BKK", bkk: "BKK", singapore: "SIN", sin: "SIN", rome: "FCO", fco: "FCO",
  barcelona: "BCN", bcn: "BCN", lisbon: "LIS", lis: "LIS", amsterdam: "AMS", ams: "AMS", berlin: "BER", ber: "BER",
  prague: "PRG", prg: "PRG", istanbul: "IST", ist: "IST", dubai: "DXB", dxb: "DXB", sydney: "SYD", syd: "SYD",
  losangeles: "LAX", lax: "LAX", vancouver: "YVR", yvr: "YVR", cairo: "CAI", cai: "CAI",
  rhodes: "RHO", rho: "RHO"
};

export function getAirportCodeFromInput(value: string, fallbackCity?: string) {
  const trimmed = value.trim();
  if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();
  const normalized = trimmed.toLowerCase().replace(/[^a-z]/g, "");
  if (airportAliases[normalized]) return airportAliases[normalized];

  const matchedCity = citySeeds.find((seed) => seed.city.toLowerCase() === trimmed.toLowerCase() || seed.city.toLowerCase().replace(/[^a-z]/g, "") === normalized);
  if (matchedCity) return airportCodeMap[matchedCity.code] ?? matchedCity.code;

  if (fallbackCity) {
    const fallback = citySeeds.find((seed) => seed.city.toLowerCase() === fallbackCity.toLowerCase());
    if (fallback) return airportCodeMap[fallback.code] ?? fallback.code;
  }

  return trimmed.slice(0,3).toUpperCase();
}

export function getAirportCodeForCity(city: string) {
  const seed = getCitySeed(city);
  return airportCodeMap[seed.code] ?? seed.code;
}

export const airportOptions = [
  { code: "JFK", label: "JFK — John F. Kennedy International Airport, New York" },
  { code: "LGA", label: "LGA — LaGuardia Airport, New York" },
  { code: "EWR", label: "EWR — Newark Liberty International Airport, Newark" },
  { code: "BOS", label: "BOS — Boston Logan International Airport, Boston" },
  { code: "LAX", label: "LAX — Los Angeles International Airport, Los Angeles" },
  { code: "SFO", label: "SFO — San Francisco International Airport, San Francisco" },
  { code: "SEA", label: "SEA — Seattle-Tacoma International Airport, Seattle" },
  { code: "ORD", label: "ORD — O'Hare International Airport, Chicago" },
  { code: "DFW", label: "DFW — Dallas/Fort Worth International Airport, Dallas" },
  { code: "ATL", label: "ATL — Hartsfield-Jackson Atlanta International Airport, Atlanta" },
  { code: "MIA", label: "MIA — Miami International Airport, Miami" },
  { code: "IAD", label: "IAD — Washington Dulles International Airport, Washington" },
  { code: "HND", label: "HND — Haneda Airport, Tokyo" },
  { code: "NRT", label: "NRT — Narita International Airport, Tokyo" },
  { code: "ICN", label: "ICN — Incheon International Airport, Seoul" },
  { code: "GMP", label: "GMP — Gimpo International Airport, Seoul" },
  { code: "PVG", label: "PVG — Shanghai Pudong International Airport, Shanghai" },
  { code: "SHA", label: "SHA — Shanghai Hongqiao International Airport, Shanghai" },
  { code: "PEK", label: "PEK — Beijing Capital International Airport, Beijing" },
  { code: "PKX", label: "PKX — Beijing Daxing International Airport, Beijing" },
  { code: "CAN", label: "CAN — Guangzhou Baiyun International Airport, Guangzhou" },
  { code: "SZX", label: "SZX — Shenzhen Bao'an International Airport, Shenzhen" },
  { code: "HKG", label: "HKG — Hong Kong International Airport, Hong Kong" },
  { code: "TPE", label: "TPE — Taiwan Taoyuan International Airport, Taipei" },
  { code: "SIN", label: "SIN — Singapore Changi Airport, Singapore" },
  { code: "BKK", label: "BKK — Suvarnabhumi Airport, Bangkok" },
  { code: "DMK", label: "DMK — Don Mueang International Airport, Bangkok" },
  { code: "CDG", label: "CDG — Charles de Gaulle Airport, Paris" },
  { code: "ORY", label: "ORY — Paris Orly Airport, Paris" },
  { code: "LHR", label: "LHR — Heathrow Airport, London" },
  { code: "LGW", label: "LGW — Gatwick Airport, London" },
  { code: "FCO", label: "FCO — Leonardo da Vinci–Fiumicino Airport, Rome" },
  { code: "BCN", label: "BCN — Josep Tarradellas Barcelona-El Prat Airport, Barcelona" },
  { code: "DXB", label: "DXB — Dubai International Airport, Dubai" },
  { code: "SYD", label: "SYD — Sydney Airport, Sydney" }
] as const;

type Option = { value: string; label: string };

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getAirportSuggestions(): Option[] {
  return airportOptions.map((item) => ({ value: item.code, label: item.label }));
}

export function resolveAirportInput(value: string): Option | null {
  const raw = value.trim();
  if (!raw) return null;
  const normalized = normalizeLookup(raw);

  const exactCode = airportOptions.find((item) => item.code.toLowerCase() === raw.toLowerCase());
  if (exactCode) return { value: exactCode.code, label: exactCode.label };

  const aliasCode = airportAliases[normalized];
  if (aliasCode) {
    const matched = airportOptions.find((item) => item.code === aliasCode);
    if (matched) return { value: matched.code, label: matched.label };
  }

  const fuzzy = airportOptions.find((item) => normalizeLookup(item.label).includes(normalized) || normalized.includes(normalizeLookup(item.label)));
  if (fuzzy) return { value: fuzzy.code, label: fuzzy.label };

  return null;
}

export function getRegionSuggestions(country?: string): Option[] {
  return getRegionsByCountry(country).map((item) => ({ value: item, label: item }));
}

export function getNeighborhoodSuggestions(country?: string, city?: string): Option[] {
  return getAreas(country, city).map((item) => ({ value: item, label: item }));
}

export function resolveLocationInput(value: string, kind: "country" | "city" | "region" | "area", poolOverride?: string[]): Option | null {
  const raw = value.trim();
  if (!raw) return null;
  const normalized = normalizeLookup(raw);

  const pools: string[] = poolOverride ?? (kind === "country"
    ? getCountries()
    : kind === "city"
      ? Array.from(new Set(citySeeds.map((city) => city.city))).sort()
      : kind === "region"
        ? Array.from(new Set(citySeeds.flatMap((city) => [city.city, ...city.neighborhoods]))).sort()
        : Array.from(new Set(citySeeds.flatMap((city) => city.neighborhoods))).sort());

  const exact = pools.find((item) => item.toLowerCase() === raw.toLowerCase());
  if (exact) return { value: exact, label: exact };

  const fuzzy = pools.find((item) => normalizeLookup(item) === normalized || normalizeLookup(item).includes(normalized) || normalized.includes(normalizeLookup(item)));
  if (fuzzy) return { value: fuzzy, label: fuzzy };

  return null;
}
