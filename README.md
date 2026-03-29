# Roamly

A polished Next.js travel planner with itinerary building, mapped routes, cost breakdowns, saved trips, and live provider integrations.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Create `.env.local` if you want live provider data:

```bash
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3-flash-preview
RAPIDAPI_KEY=
RAPIDAPI_FLIGHTS_HOST=
RAPIDAPI_FLIGHTS_URL=
RAPIDAPI_FLIGHTS_QUERY_TEMPLATE={"from":"{{origin}}","to":"{{destination}}","departDate":"{{startDate}}","returnDate":"{{endDate}}","adults":"{{groupSize}}"}
RAPIDAPI_HOTELS_HOST=
RAPIDAPI_HOTELS_URL=
RAPIDAPI_HOTELS_QUERY_TEMPLATE={"query":"{{destination}}","checkin":"{{startDate}}","checkout":"{{endDate}}","adults":"{{groupSize}}","lat":"{{lat}}","lng":"{{lng}}"}
TICKETMASTER_API_KEY=
GOOGLE_MAPS_API_KEY=
```

## RapidAPI setup

Pick any flight API and hotel API on RapidAPI, subscribe to them, then copy the host and endpoint URL from each listing into `.env.local`.

Example idea:
- `RAPIDAPI_FLIGHTS_HOST=some-flight-api.p.rapidapi.com`
- `RAPIDAPI_FLIGHTS_URL=https://some-flight-api.p.rapidapi.com/search`
- `RAPIDAPI_HOTELS_HOST=some-hotel-api.p.rapidapi.com`
- `RAPIDAPI_HOTELS_URL=https://some-hotel-api.p.rapidapi.com/search`

The `*_QUERY_TEMPLATE` values let you map this app's fields into whatever query parameters your chosen RapidAPI listing expects.

Available placeholders:
- `{{origin}}`
- `{{destination}}`
- `{{destinationCode}}`
- `{{destinationCountry}}`
- `{{startDate}}`
- `{{endDate}}`
- `{{groupSize}}`
- `{{budget}}`
- `{{lat}}`
- `{{lng}}`

Without keys, the app still runs using fallback destination data so the planning flow remains usable.

## AI setup

Gemini uses the Google GenAI SDK and reads `GEMINI_API_KEY` from your environment. You can create and manage the key in Google AI Studio.

Optional model override:
- `GEMINI_MODEL=gemini-3-flash-preview`

## Included features

- destination and country selection
- budget, traveler count, pace, and stay-style options
- itinerary generation with cost breakdowns
- map visualization
- saved trips in local storage
- shareable trip links
- GPS-based nearby place recommendations
- AI-based itinerary adjustments when Gemini is configured


## RapidAPI endpoints wired in this build

- Flights: `google-flights-live-api` roundtrip endpoint
- Hotels: `booking-live-api` search endpoint

The planner sends POST JSON bodies that match those APIs directly.
