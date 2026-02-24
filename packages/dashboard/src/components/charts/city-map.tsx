"use client";

import { memo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface CityLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  visitors: number;
  pageviews: number;
}

interface CityMapProps {
  locations: CityLocation[];
  maxVisitors: number;
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const offset = 127397;
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => c.charCodeAt(0) + offset)
  );
}

function CityMapInner({ locations, maxVisitors }: CityMapProps) {
  return (
    <MapContainer
      center={[30, 10]}
      zoom={2}
      minZoom={2}
      maxZoom={12}
      scrollWheelZoom={true}
      style={{ height: "440px", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {locations.map((loc) => {
        const ratio = maxVisitors > 0 ? loc.visitors / maxVisitors : 0;
        const radius = Math.max(5, Math.min(22, 5 + ratio * 17));
        const fillOpacity = Math.max(0.4, Math.min(0.9, 0.4 + ratio * 0.5));
        return (
          <CircleMarker
            key={`${loc.city}-${loc.country}`}
            center={[loc.latitude, loc.longitude]}
            radius={radius}
            pathOptions={{
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity,
              weight: 1.5,
              opacity: 0.8,
            }}
          >
            <Tooltip>
              <div className="text-sm">
                <div className="font-semibold">
                  {countryFlag(loc.country)} {loc.city}
                </div>
                <div className="text-xs text-muted-foreground">
                  {loc.visitors.toLocaleString()} visitors
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

export const CityMap = memo(CityMapInner);
