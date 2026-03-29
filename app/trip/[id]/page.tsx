import Link from "next/link";
import { notFound } from "next/navigation";
import { GeneratedTrip } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ data?: string }>;
};

function decodeSharedTrip(data: string): GeneratedTrip | null {
  try {
    return JSON.parse(decodeURIComponent(data)) as GeneratedTrip;
  } catch {
    return null;
  }
}

export default async function SharedTripPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { data } = await searchParams;
  if (!data) return notFound();
  const trip = decodeSharedTrip(data);
  if (!trip || trip.id !== id) return notFound();

  return (
    <div className="page-shell">
      <div className="topnav clean">
        <div className="brand"><div className="brand-badge">✈</div>Roamly</div>
        <Link href="/" className="secondary-btn">Back to planner</Link>
      </div>

      <div className="card section-card">
        <h1 className="section-title">{trip.input.destination} trip</h1>
        <p className="section-subtitle">{trip.summary}</p>
        <div className="summary-bar">
          <div className="summary-stat"><span>Total</span><strong>{formatMoney(trip.price.total)}</strong></div>
          <div className="summary-stat"><span>Per person</span><strong>{formatMoney(trip.price.perPerson)}</strong></div>
          <div className="summary-stat"><span>Dates</span><strong>{trip.input.startDate}</strong></div>
          <div className="summary-stat"><span>Travelers</span><strong>{trip.input.groupSize}</strong></div>
        </div>
      </div>

      <div className="card section-card" style={{ marginTop: 18 }}>
        <h2 className="section-title">Itinerary</h2>
        {trip.days.map((day) => (
          <div className="day-card" key={day.date}>
            <div className="day-head">
              <div>
                <strong>Day {day.day}</strong>
                <div className="muted">{day.date} · {day.neighborhood} · {day.theme}</div>
              </div>
              <div>{formatMoney(day.estimatedDayCost)}</div>
            </div>
            <div className="activity-list">
              {day.stops.map((stop) => (
                <div className="activity-item" key={stop.id}>
                  <strong>{stop.name}</strong>
                  <div className="muted">{stop.type}</div>
                  <div>{stop.description}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
