export type Vibe = "food" | "relaxing" | "action" | "nightlife" | "culture" | "nature" | "shopping";
export type Pace = "easy" | "balanced" | "packed";
export type StayStyle = "budget" | "boutique" | "comfort" | "luxury";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "KRW" | "SGD" | "THB";
export type TravelMode = "walk" | "drive";
export type TripType = "single" | "multi";

export type TripStopInput = {
  destination: string;
  destinationCountry?: string;
  destinationRegion?: string;
  selectedArea?: string;
  startDate: string;
  endDate: string;
};

export type PlannerInput = {
  origin: string;
  destination: string;
  destinationCountry?: string;
  destinationRegion?: string;
  selectedArea?: string;
  startDate: string;
  endDate: string;
  tripType?: TripType;
  tripStops?: TripStopInput[];
  budget: number;
  groupSize: number;
  children?: number;
  currency?: CurrencyCode;
  hotelFilters?: string[];
  vibe: Vibe[];
  customVibes?: string[];
  pace?: Pace;
  stayStyle?: StayStyle;
  notes?: string;
  travelerLat?: number;
  travelerLng?: number;
  useCurrentLocation?: boolean;
  dateFlexibilityDays?: number;
};

export type Stop = {
  id: string;
  name: string;
  type: "hotel" | "flight" | "activity" | "restaurant";
  lat: number;
  lng: number;
  address?: string;
  estimatedCost?: number;
  startTime?: string;
  endTime?: string;
  description?: string;
  source?: string;
  bookingUrl?: string;
  rating?: number;
  photoUrl?: string;
};

export type DayPlan = {
  day: number;
  date: string;
  theme: string;
  neighborhood: string;
  stops: Stop[];
  estimatedDayCost: number;
  segmentLabel?: string;
  destination?: string;
};

export type PriceBreakdown = {
  flights: number;
  hotel: number;
  activities: number;
  food: number;
  transport: number;
  total: number;
  perPerson: number;
};

export type TravelRecommendation = {
  id: string;
  title: string;
  category: "flight" | "hotel" | "event" | "restaurant" | "activity";
  price: number;
  summary: string;
  url?: string;
  source: string;
  rating?: number;
  address?: string;
  lat?: number;
  lng?: number;
  metadata?: {
    startDate?: string;
    endDate?: string;
    isAlternateDate?: boolean;
    area?: string;
    travelMode?: TravelMode;
    travelMinutes?: number;
    segmentIndex?: number;
    destination?: string;
  };
};

export type TripSegment = {
  id: string;
  title: string;
  input: PlannerInput;
  summary: string;
  days: DayPlan[];
  recommendations: TravelRecommendation[];
  price: PriceBreakdown;
  locationContext?: {
    requestedCurrentLocation: boolean;
    planningCenter: string;
    planningLat: number;
    planningLng: number;
  };
};

export type GeneratedTrip = {
  id: string;
  input: PlannerInput;
  summary: string;
  whyThisPlanWorks: string[];
  recommendations: TravelRecommendation[];
  days: DayPlan[];
  mapPoints: Stop[];
  price: PriceBreakdown;
  createdAt: string;
  liveDataUsed: string[];
  tripSegments?: TripSegment[];
  locationContext?: {
    requestedCurrentLocation: boolean;
    planningCenter: string;
    planningLat: number;
    planningLng: number;
  };
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};
