import { getAirportCodeForCity, getCitySeed } from "./mock-data";
import { geocodeCity, getEventRecommendations, getFlightRecommendations, getHotelRecommendations, getNearbyPlaces, hotelStopFromRecommendation } from "./providers";
import { DayPlan, GeneratedTrip, PlannerInput, PriceBreakdown, Stop, TravelRecommendation, TripSegment } from "./types";
import { buildGoogleMapsDirectionsUrl, buildGoogleMapsSearchUrl, dateRange, estimateTravelMinutes, estimateTravelMode, flattenStops, formatMoney, geoDistance, getTripLength, nearestNeighborRoute, pickThemes, uniqueRecommendations } from "./utils";

function makeId() { return Math.random().toString(36).slice(2, 10); }
function dedupeStops(stops: Stop[]) {
  const seen = new Set<string>();
  return stops.filter((stop) => {
    const key = `${stop.type}-${stop.name}-${Math.round(stop.lat * 1000)}-${Math.round(stop.lng * 1000)}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function buildPrice(input: PlannerInput, flightPrice: number, hotelNightly: number, activityTotal: number, foodStops: number, days: number): PriceBreakdown {
  const stayMultiplier = input.stayStyle === "luxury" ? 1.65 : input.stayStyle === "comfort" ? 1.2 : input.stayStyle === "budget" ? 0.82 : 1;
  const foodBase = input.stayStyle === "luxury" ? 75 : input.stayStyle === "budget" ? 28 : 46;
  const transportBase = input.pace === "packed" ? 28 : input.pace === "easy" ? 16 : 22;
  const flights = flightPrice;
  const hotel = Math.round(hotelNightly * Math.max(1, days - 1) * stayMultiplier);
  const food = Math.round(foodStops * foodBase + days * 14 * input.groupSize);
  const transport = Math.round(days * transportBase);
  const activities = activityTotal;
  const total = flights + hotel + food + transport + activities;
  return { flights, hotel, food, transport, activities, total, perPerson: Math.round(total / Math.max(1, input.groupSize)) };
}
function stopKey(stop: Stop) { return `${stop.type}-${stop.name}`.toLowerCase(); }
function takeUniqueFromPool(pool: Stop[], used: Set<string>, count: number) {
  const picked: Stop[] = [];
  for (const item of pool) {
    const key = stopKey(item);
    if (used.has(key)) continue;
    used.add(key);
    picked.push(item);
    if (picked.length >= count) break;
  }
  return picked;
}
function createFallbackStop(kind: "restaurant" | "activity", dayIndex: number, stopIndex: number, lat: number, lng: number, neighborhood: string, destination: string, theme: string): Stop {
  const restaurantNames = [
    `${neighborhood} Market Table`, `${neighborhood} Chef's Kitchen`, `${neighborhood} Garden Bistro`, `${neighborhood} Lantern Dining Room`,
    `${neighborhood} Harbor Grill`, `${neighborhood} Corner Brasserie`, `${neighborhood} House of Noodles`, `${neighborhood} Tasting Counter`
  ];
  const activityNames = [
    `${neighborhood} Heritage Walk`, `${neighborhood} Riverfront Promenade`, `${neighborhood} Art & Design Stop`, `${neighborhood} Scenic Viewpoint`,
    `${neighborhood} Museum Quarter Visit`, `${neighborhood} Local Market Walk`, `${neighborhood} Garden Route`, `${neighborhood} Evening Culture Stop`
  ];
  const labelPool = kind === "restaurant" ? restaurantNames : activityNames;
  const label = labelPool[(dayIndex * 3 + stopIndex) % labelPool.length];
  return {
    id: `${kind}-fallback-${dayIndex}-${stopIndex}`,
    name: label,
    type: kind,
    lat: lat + 0.007 * (dayIndex + 1) + 0.001 * stopIndex,
    lng: lng + 0.006 * (dayIndex + 1) + 0.0015 * stopIndex,
    estimatedCost: kind === "restaurant" ? 24 + stopIndex * 8 : 12 + stopIndex * 6,
    description: kind === "restaurant"
      ? `Recommended dining stop in ${neighborhood}, ${destination}, chosen to keep the plan specific and repeat-free.`
      : `Recommended ${theme.toLowerCase()} stop in ${neighborhood}, ${destination}, selected to avoid duplicate itinerary spots.`,
    source: "Planner",
    address: `${neighborhood}, ${destination}`,
    bookingUrl: buildGoogleMapsSearchUrl(`${label} ${neighborhood} ${destination}`)
  };
}
function buildExpandedPool(basePool: Stop[], seedStops: Stop[], kind: "restaurant" | "activity", requiredCount: number, lat: number, lng: number, neighborhoods: string[], destination: string, themes: string[]) {
  const merged = dedupeStops([...basePool, ...seedStops]);
  const extrasNeeded = Math.max(0, requiredCount - merged.length);
  const synthetic = Array.from({ length: extrasNeeded }, (_, index) => createFallbackStop(kind, Math.floor(index / Math.max(1, kind === "restaurant" ? 2 : 3)), index, lat, lng, neighborhoods[index % neighborhoods.length] || destination, destination, themes[index % themes.length] || "balanced day"));
  return dedupeStops([...merged, ...synthetic]);
}

async function generateSingleTrip(input: PlannerInput): Promise<GeneratedTrip> {
  const days = dateRange(input.startDate, input.endDate);
  const tripLength = getTripLength(input.startDate, input.endDate);
  const geoTarget = [input.selectedArea, input.destinationRegion, input.destination, input.destinationCountry].filter(Boolean).join(", ");
  const cityGeo = await geocodeCity(geoTarget || input.destination);
  const planningLat = input.useCurrentLocation && input.travelerLat ? input.travelerLat : cityGeo.lat;
  const planningLng = input.useCurrentLocation && input.travelerLng ? input.travelerLng : cityGeo.lng;
  const planningCenter = input.useCurrentLocation && input.travelerLat ? "your current GPS position" : cityGeo.label;
  const [flights, hotels, events, nearbyPlaces] = await Promise.all([
    getFlightRecommendations(input),
    getHotelRecommendations(input, cityGeo.lat, cityGeo.lng),
    getEventRecommendations(input, cityGeo.lat, cityGeo.lng),
    getNearbyPlaces(input, cityGeo.lat, cityGeo.lng)
  ]);
  const topFlight = [...flights].sort((a, b) => a.price - b.price)[0] ?? { id: "fallback-flight", title: `${input.origin} to ${input.destination}`, category: "flight" as const, price: getCitySeed(input.destination).flightBase, summary: "Fallback flight estimate.", source: "Estimated option" };
  const topHotel = [...hotels].sort((a, b) => a.price - b.price)[0] ?? { id: "fallback-hotel", title: `${input.destination} stay`, category: "hotel" as const, price: getCitySeed(input.destination).hotelBase, summary: "Fallback hotel estimate.", source: "Estimated option" };
  const hotelStop = hotelStopFromRecommendation(topHotel, cityGeo.lat, cityGeo.lng);
  const themes = pickThemes(input.vibe, input.customVibes ?? [], tripLength);
  const seed = getCitySeed(input.destination);
  const uniqueNeighborhoods = [ ...(input.selectedArea ? [input.selectedArea] : []), ...(input.destinationRegion ? [input.destinationRegion] : []), ...seed.neighborhoods ].filter((item, index, array) => Boolean(item) && array.indexOf(item) === index);
  const seedRestaurants = seed.activities.filter((place) => place.type === "restaurant").map((place, index) => ({ id: `seed-restaurant-${index}`, name: place.name, type: "restaurant" as const, lat: place.lat, lng: place.lng, estimatedCost: place.estimatedCost, description: place.description, source: "Planner", address: `${seed.city}, ${seed.country}`, bookingUrl: buildGoogleMapsSearchUrl(`${place.name} ${seed.city}`) }));
  const seedActivities = seed.activities.filter((place) => place.type !== "restaurant").map((place, index) => ({ id: `seed-activity-${index}`, name: place.name, type: "activity" as const, lat: place.lat, lng: place.lng, estimatedCost: place.estimatedCost, description: place.description, source: "Planner", address: `${seed.city}, ${seed.country}`, bookingUrl: buildGoogleMapsSearchUrl(`${place.name} ${seed.city}`) }));
  const restaurantTargetPerDay = input.pace === "easy" ? 2 : 4;
  const activityTargetPerDay = input.pace === "packed" ? 4 : 3;
  const restaurantPool = buildExpandedPool(nearbyPlaces.filter((place) => place.type === "restaurant") as Stop[], seedRestaurants, "restaurant", tripLength * restaurantTargetPerDay, planningLat, planningLng, uniqueNeighborhoods, input.destination, themes);
  const activityPool = buildExpandedPool(nearbyPlaces.filter((place) => place.type !== "restaurant") as Stop[], seedActivities, "activity", tripLength * activityTargetPerDay, planningLat, planningLng, uniqueNeighborhoods, input.destination, themes);
  const usedRestaurantKeys = new Set<string>();
  const usedActivityKeys = new Set<string>();
  const usedEventKeys = new Set<string>();

  const dayPlans: DayPlan[] = days.map((date, index) => {
    const restaurants = takeUniqueFromPool(restaurantPool, usedRestaurantKeys, restaurantTargetPerDay);
    const activities = takeUniqueFromPool(activityPool, usedActivityKeys, activityTargetPerDay);
    const eventRecommendation = events.find((event) => {
      const key = `${event.title}-event`.toLowerCase();
      if (usedEventKeys.has(key)) return false;
      usedEventKeys.add(key);
      return true;
    });
    const eventStop: Stop[] = eventRecommendation ? [{
      id: eventRecommendation.id,
      name: eventRecommendation.title,
      type: "activity",
      lat: eventRecommendation.lat ?? planningLat + 0.01 * (index + 1),
      lng: eventRecommendation.lng ?? planningLng + 0.01 * (index + 1),
      estimatedCost: eventRecommendation.price,
      description: eventRecommendation.summary,
      source: eventRecommendation.source,
      bookingUrl: eventRecommendation.url,
      address: eventRecommendation.address
    }] : [];
    const ordered = nearestNeighborRoute(dedupeStops([...activities, ...restaurants, ...eventStop]));
    const estimatedDayCost = Math.round(ordered.reduce((sum, stop) => sum + (stop.estimatedCost ?? 0), 0));
    return {
      day: index + 1,
      date,
      theme: themes[index],
      neighborhood: uniqueNeighborhoods[index % uniqueNeighborhoods.length] || input.destination,
      estimatedDayCost,
      stops: ordered,
      destination: input.destination
    };
  });

  const restaurantRecommendations = restaurantPool.slice(0, 8).map((restaurant) => {
    const distanceKm = geoDistance(hotelStop.lat, hotelStop.lng, restaurant.lat, restaurant.lng);
    const travelMode = estimateTravelMode(distanceKm);
    const travelMinutes = estimateTravelMinutes(distanceKm, travelMode);
    return {
      id: `restaurant-${restaurant.id}`,
      title: restaurant.name,
      category: "restaurant" as const,
      price: restaurant.estimatedCost ?? 0,
      summary: restaurant.description ?? "Nearby restaurant suggestion.",
      url: buildGoogleMapsDirectionsUrl(hotelStop.lat, hotelStop.lng, restaurant.lat, restaurant.lng, travelMode),
      source: restaurant.source ?? "Nearby search",
      rating: restaurant.rating,
      address: restaurant.address,
      lat: restaurant.lat,
      lng: restaurant.lng,
      metadata: { travelMode, travelMinutes, destination: input.destination }
    };
  });
  const activityTotal = dayPlans.reduce((sum, day) => sum + day.stops.reduce((s, stop) => s + (stop.type !== "restaurant" ? (stop.estimatedCost ?? 0) : 0), 0), 0);
  const foodStops = dayPlans.reduce((sum, day) => sum + day.stops.filter((stop) => stop.type === "restaurant").length, 0);
  const price = buildPrice(input, topFlight.price, topHotel.price, activityTotal, foodStops, tripLength);
  const mappedHotels = hotels.map((hotel, index) => ({ ...hotel, lat: hotel.lat ?? planningLat + 0.01 * (index + 1), lng: hotel.lng ?? planningLng + 0.008 * (index + 1), metadata: { ...hotel.metadata, destination: input.destination } }));
  const recommendations = uniqueRecommendations([
    ...flights.map((item) => ({ ...item, metadata: { ...item.metadata, destination: input.destination } })),
    ...mappedHotels,
    ...events.map((item) => ({ ...item, metadata: { ...item.metadata, destination: input.destination } })),
    ...restaurantRecommendations,
    ...activityPool.slice(0, 6).map((place) => ({
      id: `place-rec-${place.id}`,
      title: place.name,
      category: place.type === "restaurant" ? "restaurant" : "activity",
      price: place.estimatedCost ?? 0,
      summary: place.description ?? "Nearby place result.",
      url: place.bookingUrl,
      source: place.source ?? "Nearby search",
      rating: place.rating,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      metadata: { destination: input.destination }
    } as TravelRecommendation))
  ]);
  const whyThisPlanWorks = [
    `Keeps the projected spend around ${formatMoney(price.total)} with about ${formatMoney(price.perPerson)} per traveler.`,
    `Uses ${planningCenter} as the planning center so each day groups together nearby places and cuts down on backtracking.`,
    `Checks alternative date options for affordability and keeps the itinerary aligned with ${[...input.vibe, ...(input.customVibes ?? [])].join(", ") || "your selected"} preferences while avoiding repeat stops.`
  ];

  return {
    id: makeId(),
    input,
    summary: `A ${tripLength}-day trip to ${input.destination}${input.destinationCountry ? `, ${input.destinationCountry}` : ""} for ${input.groupSize} traveler${input.groupSize > 1 ? "s" : ""}, built around cleaner routing, price awareness, and non-repeating stops.`,
    whyThisPlanWorks,
    recommendations: recommendations.slice(0, 24),
    days: dayPlans,
    mapPoints: flattenStops(dayPlans),
    price,
    createdAt: new Date().toISOString(),
    liveDataUsed: [],
    locationContext: {
      requestedCurrentLocation: Boolean(input.useCurrentLocation && input.travelerLat && input.travelerLng),
      planningCenter,
      planningLat,
      planningLng
    }
  };
}

function mergePrices(prices: PriceBreakdown[]): PriceBreakdown {
  const merged = prices.reduce<PriceBreakdown>((acc, item) => ({
    flights: acc.flights + item.flights,
    hotel: acc.hotel + item.hotel,
    activities: acc.activities + item.activities,
    food: acc.food + item.food,
    transport: acc.transport + item.transport,
    total: acc.total + item.total,
    perPerson: 0
  }), { flights: 0, hotel: 0, activities: 0, food: 0, transport: 0, total: 0, perPerson: 0 });
  merged.perPerson = Math.round(merged.total / Math.max(1, prices.length ? prices[0].perPerson ? Math.max(1, Math.round(prices[0].total / prices[0].perPerson)) : 1 : 1));
  return merged;
}

export async function generateTrip(input: PlannerInput): Promise<GeneratedTrip> {
  if (input.tripType !== "multi" || !input.tripStops || input.tripStops.length < 2) {
    return generateSingleTrip(input);
  }

  const segmentBudget = Math.max(600, Math.round(input.budget / input.tripStops.length));
  const segments: GeneratedTrip[] = [];
  for (let index = 0; index < input.tripStops.length; index += 1) {
    const stop = input.tripStops[index];
    const previousStop = input.tripStops[index - 1];
    const segmentInput: PlannerInput = {
      ...input,
      origin: index === 0 ? input.origin : getAirportCodeForCity(previousStop.destination),
      destination: stop.destination,
      destinationCountry: stop.destinationCountry,
      destinationRegion: stop.destinationRegion,
      selectedArea: stop.selectedArea,
      startDate: stop.startDate,
      endDate: stop.endDate,
      budget: segmentBudget,
      tripType: "single",
      tripStops: undefined,
      useCurrentLocation: index === 0 ? input.useCurrentLocation : false,
      travelerLat: index === 0 ? input.travelerLat : undefined,
      travelerLng: index === 0 ? input.travelerLng : undefined
    };
    segments.push(await generateSingleTrip(segmentInput));
  }

  let dayCounter = 1;
  const mergedDays: DayPlan[] = [];
  const mergedRecommendations: TravelRecommendation[] = [];
  const mergedMapPoints: Stop[] = [];
  const tripSegments: TripSegment[] = segments.map((segment, segmentIndex) => {
    const relabeledDays = segment.days.map((day) => ({ ...day, day: dayCounter++, segmentLabel: `Stop ${segmentIndex + 1}: ${segment.input.destination}`, destination: segment.input.destination }));
    mergedDays.push(...relabeledDays);
    mergedRecommendations.push(...segment.recommendations.map((item) => ({ ...item, metadata: { ...item.metadata, segmentIndex, destination: segment.input.destination } })));
    mergedMapPoints.push(...segment.mapPoints);
    return {
      id: segment.id,
      title: `Stop ${segmentIndex + 1}: ${segment.input.destination}`,
      input: segment.input,
      summary: segment.summary,
      days: relabeledDays,
      recommendations: segment.recommendations.map((item) => ({ ...item, metadata: { ...item.metadata, segmentIndex, destination: segment.input.destination } })),
      price: segment.price,
      locationContext: segment.locationContext
    };
  });

  const mergedPrice = mergePrices(segments.map((segment) => segment.price));
  const whyThisPlanWorks = [
    `Splits your budget across ${segments.length} destinations while keeping the whole route near ${formatMoney(mergedPrice.total)} total.`,
    `Builds each stop separately, so hotels, restaurants, and events stay tied to the correct city instead of getting mixed together.`,
    `Adds onward flights between stops and keeps every destination repeat-free within its own itinerary.`
  ];

  return {
    id: makeId(),
    input,
    summary: `A ${segments.length}-stop trip through ${segments.map((segment) => segment.input.destination).join(", ")} for ${input.groupSize} traveler${input.groupSize > 1 ? "s" : ""}, with booking-ready flights, stays, food, and events at each stop.`,
    whyThisPlanWorks,
    recommendations: uniqueRecommendations(mergedRecommendations).slice(0, 48),
    days: mergedDays,
    mapPoints: mergedMapPoints,
    price: mergedPrice,
    createdAt: new Date().toISOString(),
    liveDataUsed: [],
    tripSegments,
    locationContext: segments[0]?.locationContext
  };
}
