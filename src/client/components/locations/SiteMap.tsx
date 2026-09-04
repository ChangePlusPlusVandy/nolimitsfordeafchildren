"use client";

import { divIcon, LatLngBounds } from "leaflet";
// Leaflet needs `window`, so this component must only ever be rendered
// client-side. Pages import it via `next/dynamic` with `ssr: false`.
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Chip, Typography } from "@mui/material";

export interface SiteMapPin {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  type: "education_center" | "pop_up" | "remote";
  is_active: boolean;
}

const createMarkerIcon = (isActive: boolean) => {
  const color = isActive ? "#2e7d32" : "#d32f2f";
  return divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const LOCATION_TYPE_LABEL: Record<SiteMapPin["type"], string> = {
  education_center: "Education Center",
  pop_up: "Pop-up",
  remote: "Remote",
};

function FitBoundsToMarkers({ pins }: { pins: Array<{ latitude: string; longitude: string }> }) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;
    const bounds = new LatLngBounds(
      pins.map((pin) => [parseFloat(pin.latitude), parseFloat(pin.longitude)] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, pins]);

  return null;
}

interface SiteMapProps {
  pins: Array<SiteMapPin & { latitude: string; longitude: string }>;
  /** Called when a marker is clicked. */
  onLocationClick?: (id: string) => void;
}

export default function SiteMap({ pins, onLocationClick }: SiteMapProps) {
  const mapCenter: [number, number] =
    pins.length > 0
      ? [
          pins.reduce((sum, pin) => sum + parseFloat(pin.latitude), 0) / pins.length,
          pins.reduce((sum, pin) => sum + parseFloat(pin.longitude), 0) / pins.length,
        ]
      : [39.8283, -98.5795];

  return (
    <MapContainer center={mapCenter} zoom={4} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[parseFloat(pin.latitude), parseFloat(pin.longitude)]}
          icon={createMarkerIcon(pin.is_active)}
          eventHandlers={{ click: () => onLocationClick?.(pin.id) }}
        >
          <Popup>
            <Box sx={{ minWidth: 150 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                {pin.name}
              </Typography>
              <Chip
                label={LOCATION_TYPE_LABEL[pin.type]}
                size="small"
                variant="outlined"
                sx={{ mt: 0.5, mb: 0.5 }}
              />
              <br />
              <Chip
                label={pin.is_active ? "Active" : "Inactive"}
                size="small"
                color={pin.is_active ? "success" : "default"}
                variant={pin.is_active ? "filled" : "outlined"}
              />
            </Box>
          </Popup>
        </Marker>
      ))}
      <FitBoundsToMarkers pins={pins} />
    </MapContainer>
  );
}
