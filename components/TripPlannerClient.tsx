"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Compass, Globe2, LocateFixed, MapPinned, Plane, Save, Sparkles, Users, Wallet } from "lucide-react";
import { ChatTurn, GeneratedTrip, Pace, PlannerInput, StayStyle, Stop, TravelRecommendation, TripSegment, TripStopInput, TripType, Vibe } from "@/lib/types";
import { destinationImage, formatMoney, safeJsonParse } from "@/lib/utils";
import { citySeeds, getAirportSuggestions, getAreas, getCitiesByCountry, getCountries, getRegionsByCountry, resolveAirportInput } from "@/lib/mock-data";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

const vibeOptions: Vibe[] = ["food", "relaxing", "action", "nightlife", "culture", "nature", "shopping"];
const paceOptions: Pace[] = ["easy", "balanced", "packed"];
const stayOptions: StayStyle[] = ["budget", "boutique", "comfort", "luxury"];
const storageKey = "roamly-saved-trips";
const countries = getCountries();
const airportSuggestions = getAirportSuggestions();
const currencyOptions = ["USD", "EUR", "GBP", "JPY", "KRW", "SGD", "THB"] as const;
const hotelFilterOptions = [
  { value: "free_cancellation", label: "Free cancellation" },
  { value: "breakfast_included", label: "Breakfast included" },
  { value: "pay_at_property", label: "Pay at property" }
] as const;
const tabOptions = ["overview", "itinerary", "stays-food", "map", "events", "book", "adjust"] as const;
type OutputTab = typeof tabOptions[number];

const blankStop = (country = "Japan", city = "Tokyo", region = "Tokyo", area = "Shibuya", startDate = "2026-06-10", endDate = "2026-06-14"): TripStopInput => ({
  destinationCountry: country,
  destination: city,
  destinationRegion: region,
  selectedArea: area,
  startDate,
  endDate
});

const defaultForm: PlannerInput = {
  origin: "JFK",
  destinationCountry: "Japan",
  destinationRegion: "Tokyo",
  selectedArea: "Shibuya",
  destination: "Tokyo",
  startDate: "2026-06-10",
  endDate: "2026-06-14",
  tripType: "single",
  tripStops: [blankStop(), blankStop("South Korea", "Seoul", "Seoul", "Myeongdong", "2026-06-15", "2026-06-18")],
  budget: 4000,
  groupSize: 2,
  children: 0,
  currency: "USD",
  hotelFilters: ["free_cancellation"],
  vibe: ["food", "relaxing"],
  customVibes: [],
  pace: "balanced",
  stayStyle: "comfort",
  notes: "We want a mix of iconic places, good food, and at least one slower day.",
  useCurrentLocation: false,
  dateFlexibilityDays: 2
};

function tabLabel(tab: OutputTab) {
  return tab === "overview" ? "Overview" : tab === "itinerary" ? "Itinerary" : tab === "stays-food" ? "Stays + Food" : tab === "map" ? "Map" : tab === "events" ? "Events" : tab === "book" ? "Book" : "Adjust";
}

export default function TripPlannerClient() {
  const [form, setForm] = useState<PlannerInput>(defaultForm);
  const [trip, setTrip] = useState<GeneratedTrip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTrips, setSavedTrips] = useState<GeneratedTrip[]>([]);
  const [chatInput, setChatInput] = useState("Make one day more relaxed, add one memorable dinner, and trim the budget a little.");
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [refining, setRefining] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [screen, setScreen] = useState<"landing" | "planner">("landing");
  const [customVibeInput, setCustomVibeInput] = useState("");
  const [activeTab, setActiveTab] = useState<OutputTab>("overview");
  const [activeDay, setActiveDay] = useState(1);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  const featuredCities = citySeeds.slice(0, 10).map((city) => city.city);
  const filteredCitySuggestions = useMemo(() => getCitiesByCountry(form.destinationCountry), [form.destinationCountry]);
  const filteredRegionSuggestions = useMemo(() => getRegionsByCountry(form.destinationCountry), [form.destinationCountry]);
  const filteredAreaSuggestions = useMemo(() => getAreas(form.destinationCountry, form.destination), [form.destinationCountry, form.destination]);
  const selectedAirportLabel = useMemo(() => resolveAirportInput(form.origin)?.label ?? "", [form.origin]);

  useEffect(() => {
    const saved = safeJsonParse<GeneratedTrip[]>(localStorage.getItem(storageKey), []);
    setSavedTrips(saved);
  }, []);

  const segmentOptions = useMemo<TripSegment[]>(() => {
    if (!trip) return [];
    if (trip.tripSegments?.length) return trip.tripSegments;
    return [{
      id: trip.id,
      title: trip.input.destination,
      input: trip.input,
      summary: trip.summary,
      days: trip.days,
      recommendations: trip.recommendations,
      price: trip.price,
      locationContext: trip.locationContext
    }];
  }, [trip]);

  const activeSegment = segmentOptions[activeSegmentIndex] ?? segmentOptions[0] ?? null;
  const scopedRecommendations = activeSegment?.recommendations ?? trip?.recommendations ?? [];
  const flightOptions = useMemo(() => scopedRecommendations.filter((item) => item.category === "flight"), [scopedRecommendations]);
  const hotelOptions = useMemo(() => scopedRecommendations.filter((item) => item.category === "hotel"), [scopedRecommendations]);
  const foodOptions = useMemo(() => scopedRecommendations.filter((item) => item.category === "restaurant").slice(0, 12), [scopedRecommendations]);
  const eventOptions = useMemo(() => scopedRecommendations.filter((item) => item.category === "event").slice(0, 10), [scopedRecommendations]);
  const currentDays = activeSegment?.days ?? trip?.days ?? [];
  const selectedDayPlan = useMemo(() => currentDays.find((day) => day.day === activeDay) ?? currentDays[0] ?? null, [currentDays, activeDay]);

  useEffect(() => {
    setActiveDay(currentDays[0]?.day ?? 1);
  }, [activeSegmentIndex, trip?.id]);

  function setCountry(country: string) {
    setForm((current) => {
      const validCities = getCitiesByCountry(country);
      const destination = validCities.includes(current.destination) ? current.destination : "";
      const validRegions = getRegionsByCountry(country);
      const destinationRegion = validRegions.includes(current.destinationRegion ?? "") ? current.destinationRegion : "";
      const validAreas = getAreas(country, destination);
      const selectedArea = validAreas.includes(current.selectedArea ?? "") ? current.selectedArea : "";
      return { ...current, destinationCountry: country, destination, destinationRegion, selectedArea };
    });
    setError(null);
  }

  function setDestinationCity(city: string) {
    setForm((current) => {
      const validAreas = getAreas(current.destinationCountry, city);
      const selectedArea = validAreas.includes(current.selectedArea ?? "") ? current.selectedArea : "";
      return { ...current, destination: city, destinationRegion: current.destinationRegion || city, selectedArea };
    });
  }

  function updateTripType(tripType: TripType) {
    setForm((current) => ({ ...current, tripType }));
    setError(null);
  }

  function updateTripStop(index: number, patch: Partial<TripStopInput>) {
    setForm((current) => ({
      ...current,
      tripStops: (current.tripStops ?? []).map((stop, stopIndex) => stopIndex === index ? { ...stop, ...patch } : stop)
    }));
  }

  function setTripStopCountry(index: number, country: string) {
    const validCities = getCitiesByCountry(country);
    const city = validCities[0] ?? "";
    updateTripStop(index, {
      destinationCountry: country,
      destination: city,
      destinationRegion: getRegionsByCountry(country)[0] ?? city,
      selectedArea: getAreas(country, city)[0] ?? ""
    });
  }

  function setTripStopCity(index: number, country: string, city: string) {
    updateTripStop(index, {
      destination: city,
      destinationRegion: getRegionsByCountry(country)[0] ?? city,
      selectedArea: getAreas(country, city)[0] ?? ""
    });
  }

  function addTripStop() {
    const last = form.tripStops?.[form.tripStops.length - 1];
    setForm((current) => ({
      ...current,
      tripStops: [...(current.tripStops ?? []), blankStop(last?.destinationCountry ?? "Japan", last?.destination ?? "Tokyo", last?.destinationRegion ?? "Tokyo", last?.selectedArea ?? "Shibuya", last?.endDate ?? current.endDate, last?.endDate ?? current.endDate)]
    }));
  }

  function removeTripStop(index: number) {
    setForm((current) => ({ ...current, tripStops: (current.tripStops ?? []).filter((_, stopIndex) => stopIndex !== index) }));
  }

  async function handleGenerate() {
    const resolved = resolveAirportInput(form.origin);
    if (!resolved) {
      setError("Please choose a real departure airport from the list.");
      return;
    }
    if (form.tripType === "multi") {
      const stops = form.tripStops ?? [];
      if (stops.length < 2) {
        setError("Add at least two destinations for a multi-destination trip.");
        return;
      }
      if (stops.some((stop) => !stop.destinationCountry || !stop.destination || !stop.startDate || !stop.endDate)) {
        setError("Complete every destination stop before building your trip.");
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, origin: resolved.value };
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to generate trip.");
      setForm(payload);
      setTrip(data.trip);
      setChat([]);
      setActiveTab("overview");
      setActiveDay(1);
      setActiveSegmentIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function toggleVibe(vibe: Vibe) {
    setForm((current) => ({ ...current, vibe: current.vibe.includes(vibe) ? current.vibe.filter((item) => item !== vibe) : [...current.vibe, vibe] }));
  }
  function toggleHotelFilter(filter: string) {
    setForm((current) => ({ ...current, hotelFilters: current.hotelFilters?.includes(filter) ? current.hotelFilters.filter((item) => item !== filter) : [...(current.hotelFilters ?? []), filter] }));
  }
  function saveTrip() {
    if (!trip) return;
    const next = [trip, ...savedTrips.filter((item) => item.id !== trip.id)].slice(0, 12);
    setSavedTrips(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }
  async function downloadPdf() {
    if (!trip) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    let y = 44;
    const margin = 40;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    const write = (text: string, size = 11) => {
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, width);
      if (y > 720) { doc.addPage(); y = 44; }
      doc.text(lines, margin, y);
      y += lines.length * 14 + 8;
    };
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(`${trip.input.tripType === "multi" ? "Multi-Destination" : trip.input.destination} Trip Plan`, margin, y);
    y += 28;
    write(trip.summary);
    write(`Total cost: ${formatMoney(trip.price.total)} | Per person: ${formatMoney(trip.price.perPerson)}`);
    (trip.tripSegments ?? [{ title: trip.input.destination, days: trip.days }]).forEach((segment) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      if (y > 700) { doc.addPage(); y = 44; }
      doc.text(segment.title, margin, y);
      y += 20;
      segment.days.forEach((day) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        if (y > 700) { doc.addPage(); y = 44; }
        doc.text(`Day ${day.day} — ${day.date}`, margin, y);
        y += 18;
        write(`${day.neighborhood} | ${day.theme} | Estimated: ${formatMoney(day.estimatedDayCost)}`);
        day.stops.forEach((stop) => write(`• ${stop.name} (${stop.type})${stop.address ? ` — ${stop.address}` : ""}`));
      });
    });
    doc.save(`${(trip.input.tripType === "multi" ? "multi-destination" : trip.input.destination).toLowerCase().replace(/\s+/g, "-")}-plan.pdf`);
  }
  async function refineTrip() {
    if (!trip || !chatInput.trim()) return;
    const nextUserTurn: ChatTurn = { role: "user", content: chatInput };
    setChat((current) => [...current, nextUserTurn]);
    setRefining(true);
    try {
      const response = await fetch("/api/refine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: chatInput, trip }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Refinement failed.");
      setChat((current) => [...current, { role: "assistant", content: data.suggestion }]);
      setChatInput("");
    } catch (err) {
      setChat((current) => [...current, { role: "assistant", content: err instanceof Error ? err.message : "Refinement failed." }]);
    } finally { setRefining(false); }
  }
  function addCustomVibe() {
    const cleaned = customVibeInput.trim();
    if (!cleaned || (form.customVibes ?? []).some((item) => item.toLowerCase() === cleaned.toLowerCase())) { setCustomVibeInput(""); return; }
    setForm((current) => ({ ...current, customVibes: [...(current.customVibes ?? []), cleaned] }));
    setCustomVibeInput("");
  }
  function removeCustomVibe(value: string) { setForm((current) => ({ ...current, customVibes: (current.customVibes ?? []).filter((item) => item !== value) })); }
  function useMyLocation() {
    if (!("geolocation" in navigator)) { setError("Geolocation is not available in this browser."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition((position) => {
      setForm((current) => ({ ...current, travelerLat: position.coords.latitude, travelerLng: position.coords.longitude, useCurrentLocation: true }));
      setLocationLabel(`Using current location (${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)})`);
      setLocating(false);
    }, () => { setError("We couldn't access your location. You can still plan using the destination center."); setLocating(false); }, { enableHighAccuracy: true, timeout: 10000 });
  }

  const cheapestFlight = flightOptions[0];
  const exactMatchFlight = flightOptions.find((item) => !item.metadata?.isAlternateDate) ?? cheapestFlight;
  const alternateFlights = flightOptions.filter((item) => item.metadata?.isAlternateDate);
  const hotelMapStops = useMemo<Stop[]>(() => hotelOptions.slice(0, 8).map((item, index) => ({
    id: item.id || `hotel-map-${index}`,
    name: item.title,
    type: "hotel",
    lat: item.lat ?? ((activeSegment?.locationContext?.planningLat ?? trip?.locationContext?.planningLat ?? 0) + 0.008 * (index + 1)),
    lng: item.lng ?? ((activeSegment?.locationContext?.planningLng ?? trip?.locationContext?.planningLng ?? 0) + 0.006 * (index + 1)),
    address: item.address,
    description: item.summary,
    bookingUrl: item.url,
    rating: item.rating,
    source: item.source,
    estimatedCost: item.price
  })), [hotelOptions, activeSegment, trip]);
  const selectedHotel = useMemo(() => {
    const hotelReco = hotelOptions[0];
    if (!hotelReco) return null;
    return {
      id: `selected-${hotelReco.id}`,
      name: hotelReco.title,
      type: "hotel" as const,
      lat: hotelReco.lat ?? activeSegment?.locationContext?.planningLat ?? trip?.locationContext?.planningLat ?? 0,
      lng: hotelReco.lng ?? activeSegment?.locationContext?.planningLng ?? trip?.locationContext?.planningLng ?? 0,
      address: hotelReco.address,
      description: hotelReco.summary,
      bookingUrl: hotelReco.url,
      rating: hotelReco.rating,
      source: hotelReco.source,
      estimatedCost: hotelReco.price
    };
  }, [hotelOptions, activeSegment, trip]);

  function titleCaseCategory(category: TravelRecommendation["category"]) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
  function stopTypeLabel(type: Stop["type"]) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  function stopTypeClass(type: Stop["type"]) {
    return `type-${type}`;
  }

  function renderRecommendation(item: TravelRecommendation) {
    const isFlight = item.category === "flight";
    return (
      <div className="reco-item" key={item.id}>
        <strong>{item.title}</strong>
        <div className="muted">{titleCaseCategory(item.category)} · {formatMoney(item.price)}{item.rating ? ` · ${item.rating.toFixed(1)}★` : ""}</div>
        {(item.metadata?.startDate || item.metadata?.endDate) ? <div className="date-chip">{item.metadata?.startDate} → {item.metadata?.endDate}</div> : null}
        <div className={`category-chip category-${item.category}`}>{titleCaseCategory(item.category)}</div>
        <div>{item.summary}</div>
        {item.address ? <div className="muted">{item.address}</div> : null}
        {item.metadata?.travelMinutes ? <div className="muted">About {item.metadata.travelMinutes} min by {item.metadata.travelMode}</div> : null}
        {item.url ? <a className={`action-link ${isFlight ? "flight-link" : ""}`} href={item.url} target="_blank" rel="noreferrer">{isFlight ? "Buy Flight" : item.category === "event" ? "Open Event" : item.category === "hotel" ? "Reserve Stay" : "Open Details"}</a> : null}
      </div>
    );
  }

  return (
    <div className="page-shell colorful-shell">
      <div className="topnav clean"><div className="brand"><div className="brand-badge"><Compass size={18} /></div>Roamly</div><div className="nav-right"><div className="muted small-hide">Trips planned around real places, not generic lists.</div></div></div>
      <section className="hero clean-hero vivid-hero">
        <div className="hero-copy">
          <div className="kicker vivid"><Sparkles size={14} style={{ marginRight: 8 }} />Plan around real places and your trip style</div>
          <h1>Hotels, restaurants, attractions, routes, and booking actions in one trip.</h1>
          <p>Choose one destination or build a multi-stop route. Roamly plans the itinerary, surfaces events, and gives you one place to book the essentials.</p>
          <div className="quick-picks">{featuredCities.map((city) => <button key={city} className="quick-pill" onClick={() => { const picked = citySeeds.find((item) => item.city === city); setForm((current) => ({ ...current, destination: city, destinationCountry: picked?.country ?? current.destinationCountry, destinationRegion: city, selectedArea: picked?.neighborhoods?.[0] ?? current.selectedArea })); }}>{city}</button>)}</div>
          {screen === "landing" ? <div className="hero-cta-row"><button className="primary-btn" onClick={() => setScreen("planner")}>Start Trip Details</button></div> : null}
        </div>
        <div className="hero-visual gradient-card" style={{ backgroundImage: `linear-gradient(180deg, rgba(17,24,39,.18), rgba(17,24,39,.62)), url(${destinationImage(form.tripType === "multi" ? (form.tripStops?.[0]?.destination || form.destination) : form.destination)})` }}><div className="floating-card colorful-float"><div className="mini-stat"><Globe2 size={16} /> {form.tripType === "multi" ? `${form.tripStops?.length ?? 0} stops` : `${form.destination}${form.destinationCountry ? `, ${form.destinationCountry}` : ""}`}</div><div className="mini-stat"><Users size={16} /> {form.groupSize} traveler{form.groupSize > 1 ? "s" : ""}</div><div className="mini-stat"><Wallet size={16} /> {formatMoney(form.budget)} total budget</div>{form.useCurrentLocation ? <div className="mini-stat"><LocateFixed size={16} /> GPS enabled for nearby picks</div> : null}</div></div>
      </section>
      {screen === "planner" ? <div className="grid-main wide">
        <section className="card section-card planner-panel colorful-panel">
          <div className="panel-head"><div><h2 className="section-title">Trip details</h2><p className="section-subtitle">Switch between a single destination and a multi-destination route, then build your plan with booking-ready essentials.</p></div></div>
          <div className="form-grid">
            <div>
              <label className="field-label">Trip Type</label>
              <div className="pill-wrap compact">
                {(["single", "multi"] as TripType[]).map((tripType) => <button key={tripType} type="button" className={`pill ${form.tripType === tripType ? "active" : ""}`} onClick={() => updateTripType(tripType)}>{tripType === "single" ? "Single Destination" : "Multi-Destination"}</button>)}
              </div>
            </div>
            <div className="row-2">
              <div><label className="field-label">Leaving From</label><input className="input" list="airport-suggestions" placeholder="Select a departure airport" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} /><datalist id="airport-suggestions">{airportSuggestions.map((airport) => <option key={airport.value} value={airport.value}>{airport.label}</option>)}</datalist>{selectedAirportLabel ? <div className="muted helper-text">{selectedAirportLabel}</div> : null}</div>
              <div><label className="field-label">Budget</label><input className="input" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} /></div>
            </div>
            {form.tripType === "single" ? <>
              <div className="row-2">
                <div><label className="field-label">Destination Country / Region</label><select className="select" value={form.destinationCountry ?? ""} onChange={(e) => setCountry(e.target.value)}><option value="">Select destination country</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select></div>
                <div><label className="field-label">Destination City</label><select className="select" value={form.destination} onChange={(e) => setDestinationCity(e.target.value)}><option value="">Select destination city</option>{filteredCitySuggestions.map((city) => <option key={city} value={city}>{city}</option>)}</select></div>
              </div>
              <div className="row-2">
                <div><label className="field-label">State / Province / Region</label><select className="select" value={form.destinationRegion ?? ""} onChange={(e) => setForm({ ...form, destinationRegion: e.target.value })}><option value="">Select state / province / region</option>{filteredRegionSuggestions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                <div><label className="field-label">Specific Area You Want To Stay In</label><select className="select" value={form.selectedArea ?? ""} onChange={(e) => setForm({ ...form, selectedArea: e.target.value })}><option value="">Select area / neighborhood</option>{filteredAreaSuggestions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              </div>
              <div className="row-3 row-3-dates"><div><label className="field-label">Start</label><input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div><div><label className="field-label">End</label><input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div><div className="date-flex-field"><label className="field-label">Date Flexibility</label><select className="select select-date-flex" value={form.dateFlexibilityDays ?? 2} onChange={(e) => setForm({ ...form, dateFlexibilityDays: Number(e.target.value) })}>{[0,1,2,3].map((days) => <option key={days} value={days}>{days===0?"Exact Dates Only":`±${days} Day${days===1?"":"s"}`}</option>)}</select></div></div>
            </> : <div className="multi-stop-stack">{(form.tripStops ?? []).map((stop, index) => {
              const stopCities = getCitiesByCountry(stop.destinationCountry);
              const stopRegions = getRegionsByCountry(stop.destinationCountry);
              const stopAreas = getAreas(stop.destinationCountry, stop.destination);
              return <div className="card glass-card stop-builder-card" key={`stop-${index}`}><div className="result-header-row"><div><h3 className="section-title" style={{ marginBottom: 4 }}>Stop {index + 1}</h3><p className="section-subtitle">Add a destination, dates, and area for this leg of the trip.</p></div>{(form.tripStops?.length ?? 0) > 2 ? <button type="button" className="secondary-btn" onClick={() => removeTripStop(index)}>Remove</button> : null}</div><div className="row-2"><div><label className="field-label">Destination Country / Region</label><select className="select" value={stop.destinationCountry ?? ""} onChange={(e) => setTripStopCountry(index, e.target.value)}><option value="">Select destination country</option>{countries.map((country) => <option key={`${index}-${country}`} value={country}>{country}</option>)}</select></div><div><label className="field-label">Destination City</label><select className="select" value={stop.destination} onChange={(e) => setTripStopCity(index, stop.destinationCountry ?? "", e.target.value)}><option value="">Select destination city</option>{stopCities.map((city) => <option key={`${index}-${city}`} value={city}>{city}</option>)}</select></div></div><div className="row-2"><div><label className="field-label">State / Province / Region</label><select className="select" value={stop.destinationRegion ?? ""} onChange={(e) => updateTripStop(index, { destinationRegion: e.target.value })}><option value="">Select state / province / region</option>{stopRegions.map((item) => <option key={`${index}-${item}`} value={item}>{item}</option>)}</select></div><div><label className="field-label">Specific Area You Want To Stay In</label><select className="select" value={stop.selectedArea ?? ""} onChange={(e) => updateTripStop(index, { selectedArea: e.target.value })}><option value="">Select area / neighborhood</option>{stopAreas.map((item) => <option key={`${index}-${item}`} value={item}>{item}</option>)}</select></div></div><div className="row-2"><div><label className="field-label">Start</label><input className="input" type="date" value={stop.startDate} onChange={(e) => updateTripStop(index, { startDate: e.target.value })} /></div><div><label className="field-label">End</label><input className="input" type="date" value={stop.endDate} onChange={(e) => updateTripStop(index, { endDate: e.target.value })} /></div></div></div>;
            })}<div className="button-row"><button type="button" className="secondary-btn" onClick={addTripStop}>Add Another Destination</button></div></div>}
            <div className="row-3"><div><label className="field-label">Adults</label><input className="input" type="number" min={1} value={form.groupSize} onChange={(e) => setForm({ ...form, groupSize: Number(e.target.value) })} /></div><div><label className="field-label">Children</label><input className="input" type="number" min={0} value={form.children ?? 0} onChange={(e) => setForm({ ...form, children: Number(e.target.value) })} /></div><div><label className="field-label">Currency</label><select className="select" value={form.currency ?? "USD"} onChange={(e) => setForm({ ...form, currency: e.target.value as PlannerInput["currency"] })}>{currencyOptions.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select></div></div>
            <div className="row-2"><div><label className="field-label">Hotel preferences</label><div className="pill-wrap compact">{hotelFilterOptions.map((filter) => <button key={filter.value} type="button" className={`pill ${form.hotelFilters?.includes(filter.value) ? "active" : ""}`} onClick={() => toggleHotelFilter(filter.value)}>{filter.label}</button>)}</div></div><div><label className="field-label">Trip pace</label><div className="pill-wrap compact">{paceOptions.map((pace) => <button key={pace} type="button" className={`pill ${form.pace === pace ? "active" : ""}`} onClick={() => setForm({ ...form, pace })}>{pace}</button>)}</div></div></div>
            <div><label className="field-label">Stay style</label><div className="pill-wrap compact">{stayOptions.map((stay) => <button key={stay} type="button" className={`pill ${form.stayStyle === stay ? "active" : ""}`} onClick={() => setForm({ ...form, stayStyle: stay })}>{stay}</button>)}</div></div>
            <div><label className="field-label">What kind of trip is this?</label><div className="pill-wrap">{vibeOptions.map((vibe) => <button key={vibe} type="button" className={`pill ${form.vibe.includes(vibe) ? "active" : ""}`} onClick={() => toggleVibe(vibe)}>{vibe}</button>)}</div></div>
            <div className="custom-vibe-box"><label className="field-label">Add Your Own Keywords</label><div className="inline-action-row"><input className="input" placeholder="Type a keyword" autoComplete="off" value={customVibeInput} onChange={(e) => setCustomVibeInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomVibe(); } }} /><button type="button" className="secondary-btn" onClick={addCustomVibe}>Add</button></div><div className="pill-wrap compact" style={{ marginTop: 10 }}>{(form.customVibes ?? []).map((item) => <button key={item} type="button" className="pill active" onClick={() => removeCustomVibe(item)}>{item} ×</button>)}</div></div>
            <div className="gps-row"><div><label className="field-label">Current location</label><div className="gps-actions"><button type="button" className="secondary-btn" onClick={useMyLocation} disabled={locating}><LocateFixed size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />{locating ? "Getting location…" : "Use my current location"}</button>{form.useCurrentLocation ? <button type="button" className="secondary-btn" onClick={() => { setForm((current) => ({ ...current, useCurrentLocation: false, travelerLat: undefined, travelerLng: undefined })); setLocationLabel(""); }}>Clear GPS</button> : null}</div><div className="muted gps-note">{locationLabel || "Optional: use your current position to bias nearby restaurants and attractions."}</div></div></div>
            <div><label className="field-label">Notes</label><textarea className="textarea" placeholder="Anything specific you want included or avoided?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="button-row"><button className="primary-btn" onClick={handleGenerate} disabled={loading}>{loading ? "Planning…" : "Build My Trip"}</button><button className="secondary-btn" onClick={() => setForm(defaultForm)}>Reset</button></div>
            {error ? <div className="muted">{error}</div> : null}
          </div>
        </section>
        <section className="output-grid">
          {!trip ? <div className="card section-card empty-state"><div className="empty-icon"><Plane size={24} /></div><h3>Your trip plan will show up here</h3><p className="section-subtitle">Generate a trip to see a cleaner tabbed layout with itinerary, flights, stays, restaurants, events, booking actions, and a map.</p></div> : <>
            <div className="card section-card glass-card"><div className="result-header-row"><div><h2 className="section-title">{trip.input.tripType === "multi" ? "Multi-Destination overview" : `${trip.input.destination} overview`}</h2><p className="section-subtitle">{trip.summary}</p></div><div className="button-row compact-wrap"><button className="secondary-btn" onClick={saveTrip}><Save size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />Save</button><button className="secondary-btn" onClick={downloadPdf}>Download PDF</button></div></div><div className="summary-bar"><div className="summary-stat"><span>Total cost</span><strong>{formatMoney(trip.price.total)}</strong></div><div className="summary-stat"><span>Per person</span><strong>{formatMoney(trip.price.perPerson)}</strong></div><div className="summary-stat"><span>Cheapest flight</span><strong>{formatMoney(cheapestFlight?.price ?? trip.price.flights)}</strong></div><div className="summary-stat"><span>Best hotel</span><strong>{formatMoney(hotelOptions[0]?.price ?? trip.price.hotel)}</strong></div></div><div className="live-data-strip"><span className="live-pill"><MapPinned size={14} /> {activeSegment?.locationContext?.planningCenter ?? trip.locationContext?.planningCenter}</span></div>{segmentOptions.length > 1 ? <div className="day-tab-row">{segmentOptions.map((segment, index) => <button key={segment.id} type="button" className={`day-tab ${activeSegmentIndex === index ? "active" : ""}`} onClick={() => setActiveSegmentIndex(index)}>{segment.title}</button>)}</div> : null}<div className="segmented-tabs">{tabOptions.map((tab) => <button key={tab} type="button" className={`segment-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tabLabel(tab)}</button>)}</div></div>
            {activeTab === "overview" ? <div className="card section-card glass-card"><div className="feature-grid-2"><div><h3 className="section-title">Why This Plan Works</h3><div className="reco-list">{trip.whyThisPlanWorks.map((item) => <div className="reco-item" key={item}>{item}</div>)}</div></div><div><h3 className="section-title">Flight Date Suggestions</h3><div className="reco-list">{exactMatchFlight ? renderRecommendation(exactMatchFlight) : null}{alternateFlights.slice(0,3).map(renderRecommendation)}</div><p className="section-subtitle" style={{ marginTop: 12, marginBottom: 0 }}>When the live flight provider returns a booking deeplink, Buy Flight opens that exact page. Otherwise it falls back to the closest Google Flights result for the same route and dates.</p></div></div></div> : null}
            {activeTab === "itinerary" ? <div className="card section-card glass-card"><h3 className="section-title">Day-by-Day Itinerary</h3><div className="day-tab-row">{currentDays.map((day) => <button key={`${day.day}-${day.date}`} type="button" className={`day-tab ${selectedDayPlan?.day === day.day ? "active" : ""}`} onClick={() => setActiveDay(day.day)}>Day {day.day}</button>)}</div>{selectedDayPlan ? <div className="day-card active-day-panel"><div className="day-head"><div><strong>Day {selectedDayPlan.day}</strong><div className="muted">{selectedDayPlan.date} · {selectedDayPlan.neighborhood} · {selectedDayPlan.theme}</div></div><div>{formatMoney(selectedDayPlan.estimatedDayCost)}</div></div><div className="activity-list">{selectedDayPlan.stops.map((stop) => <div className={`activity-item ${stopTypeClass(stop.type)}`} key={stop.id}><div className="activity-top-row"><strong>{stop.name}</strong><span className={`type-chip ${stopTypeClass(stop.type)}`}>{stopTypeLabel(stop.type)}</span></div><div className="muted">{stopTypeLabel(stop.type)}{stop.rating ? ` · ${stop.rating.toFixed(1)}★` : ""}</div><div>{stop.description}</div>{stop.address ? <div className="muted">{stop.address}</div> : null}<div className="stop-meta-row">{stop.estimatedCost ? <div className="muted">Estimated: {formatMoney(stop.estimatedCost)}</div> : null}{stop.bookingUrl ? <a className="muted" href={stop.bookingUrl} target="_blank" rel="noreferrer">Open Map</a> : null}</div></div>)}</div></div> : null}</div> : null}
            {activeTab === "stays-food" ? <div className="card section-card glass-card"><div className="feature-grid-2"><div><h3 className="section-title">Affordable Stays</h3><div className="reco-list">{hotelOptions.slice(0,4).map(renderRecommendation)}</div></div><div><h3 className="section-title">Restaurants Near Your Selected Area</h3><p className="section-subtitle">Each restaurant below includes a direct Google Maps route from the suggested stay.</p><div className="reco-list">{foodOptions.map(renderRecommendation)}</div></div></div></div> : null}
            {activeTab === "map" ? <div className="card section-card glass-card"><div className="feature-grid-2 map-grid"><div><h3 className="section-title">Hotel Map</h3><MapView points={hotelMapStops} hub={selectedHotel} /></div><div><h3 className="section-title">Route Summary</h3><div className="reco-list">{foodOptions.map((item) => <div className="reco-item" key={`route-${item.id}`}><strong>{item.title}</strong><div className="muted">{item.metadata?.travelMinutes ? `${item.metadata.travelMinutes} min by ${item.metadata.travelMode}` : "Nearby route"}</div>{item.address ? <div className="muted">{item.address}</div> : null}{item.url ? <a className="action-link" href={item.url} target="_blank" rel="noreferrer">Open Google Maps Route</a> : null}</div>)}</div><h3 className="section-title" style={{ marginTop: 16 }}>Cost Breakdown</h3><div className="cost-list"><div className="small-card"><Wallet size={16} /> Flights: {formatMoney(trip.price.flights)}</div><div className="small-card">Hotel: {formatMoney(trip.price.hotel)}</div><div className="small-card">Activities: {formatMoney(trip.price.activities)}</div><div className="small-card">Food: {formatMoney(trip.price.food)}</div><div className="small-card">Transport: {formatMoney(trip.price.transport)}</div></div></div></div></div> : null}
            {activeTab === "events" ? <div className="card section-card glass-card"><div className="feature-grid-2"><div><h3 className="section-title">Events During Your Trip</h3><p className="section-subtitle">Concerts, sports, theatre, and other live events happening while you are there.</p><div className="reco-list">{eventOptions.length ? eventOptions.map(renderRecommendation) : <div className="reco-item">No live events were returned for these dates yet. Add your Ticketmaster key to pull more event results.</div>}</div></div><div><h3 className="section-title">More Restaurants Nearby</h3><div className="reco-list">{foodOptions.slice(0, 6).map(renderRecommendation)}</div></div></div></div> : null}
            {activeTab === "book" ? <div className="card section-card glass-card"><h3 className="section-title">Book All Essentials</h3><p className="section-subtitle">Open your flight, stay, events, restaurants, and PDF from one place. For multi-stop trips, each destination keeps its own booking bundle.</p><div className="reco-list">{segmentOptions.map((segment) => {
              const segmentFlights = segment.recommendations.filter((item) => item.category === "flight");
              const segmentHotels = segment.recommendations.filter((item) => item.category === "hotel");
              const segmentEvents = segment.recommendations.filter((item) => item.category === "event");
              const segmentFood = segment.recommendations.filter((item) => item.category === "restaurant");
              return <div className="reco-item" key={`book-${segment.id}`}><strong>{segment.title}</strong><div className="muted">{segment.summary}</div><div className="book-grid">{segmentFlights[0]?.url ? <a className="action-link flight-link" href={segmentFlights[0].url} target="_blank" rel="noreferrer">Buy Flight</a> : null}{segmentHotels[0]?.url ? <a className="action-link" href={segmentHotels[0].url} target="_blank" rel="noreferrer">Reserve Hotel</a> : null}{segmentEvents[0]?.url ? <a className="action-link" href={segmentEvents[0].url} target="_blank" rel="noreferrer">Book Events</a> : null}{segmentFood[0]?.url ? <a className="action-link" href={segmentFood[0].url} target="_blank" rel="noreferrer">Open Restaurants</a> : null}<button className="secondary-btn" onClick={downloadPdf}>Download PDF</button></div></div>;
            })}</div></div> : null}
            {activeTab === "adjust" ? <div className="card section-card glass-card"><h3 className="section-title">Adjust the Plan</h3><p className="section-subtitle">Ask for changes like cheaper dates, more food spots, less backtracking, or new neighborhoods without repeats.</p><div className="form-grid"><textarea className="textarea" value={chatInput} onChange={(e) => setChatInput(e.target.value)} /><div className="button-row"><button className="primary-btn" onClick={refineTrip} disabled={refining}>{refining ? "Updating…" : "Update Itinerary"}</button></div><div className="chat-list">{chat.map((message, index) => <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}><strong>{message.role === "user" ? "You" : "Planner"}</strong><div style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{message.content}</div></div>)}</div></div></div> : null}
          </>}
          {savedTrips.length ? <div className="card section-card glass-card"><h3 className="section-title">Saved trips</h3><div className="reco-list">{savedTrips.slice(0,4).map((item) => <div className="reco-item" key={item.id}><strong>{item.input.tripType === "multi" ? "Multi-destination trip" : item.input.destination}</strong><div className="muted">{item.createdAt.slice(0, 10)}</div><div>{formatMoney(item.price.total)} total · {item.input.groupSize} traveler{item.input.groupSize > 1 ? "s" : ""}</div></div>)}</div></div> : null}
        </section>
      </div> : null}
    </div>
  );
}
