"use client";

import { MapContainer, Marker, Popup, Polyline, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Stop } from "@/lib/types";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

export default function MapView({ points, hub }: { points: Stop[]; hub?: Stop | null }) {
  if (!points.length) {
    return <div className="map-fallback">Plan a trip to see the route map.</div>;
  }

  const center: [number, number] = [hub?.lat ?? points[0].lat, hub?.lng ?? points[0].lng];
  const path = points.map((point) => [point.lat, point.lng] as [number, number]);
  const spokePaths = hub ? points.map((point) => [[hub.lat, hub.lng], [point.lat, point.lng]] as [number, number][]) : [];

  return (
    <div className="map-shell">
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%", minHeight: 520 }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!hub ? <Polyline positions={path} /> : null}
        {hub ? (
          <Marker key={hub.id} position={[hub.lat, hub.lng]}>
            <Popup>
              <strong>{hub.name}</strong>
              <br />
              {hub.description || hub.address}
            </Popup>
          </Marker>
        ) : null}
        {spokePaths.map((positions, index) => <Polyline key={`spoke-${index}`} positions={positions} />)}
        {points.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]}>
            <Popup>
              <strong>{point.name}</strong>
              <br />
              {point.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
