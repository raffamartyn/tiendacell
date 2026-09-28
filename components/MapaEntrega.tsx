"use client";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Ubicacion = {
  lat: number;
  lng: number;
};

type MapaEntregaProps = {
  ubicacion: Ubicacion;
  onCambiar: (ubicacion: Ubicacion) => void;
};

/* Marcador Leaflet */
const iconoMarcador = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/* Permite tocar el mapa para cambiar ubicación */
function SelectorMapa({
  onCambiar,
}: {
  onCambiar: (ubicacion: Ubicacion) => void;
}) {
  useMapEvents({
    click(event) {
      onCambiar({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

export default function MapaEntrega({
  ubicacion,
  onCambiar,
}: MapaEntregaProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">

      <MapContainer
        center={[
          ubicacion.lat,
          ubicacion.lng,
        ]}
        zoom={16}
        scrollWheelZoom={true}
        className="h-[360px] w-full"
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[
            ubicacion.lat,
            ubicacion.lng,
          ]}
          icon={iconoMarcador}
          draggable={true}
          eventHandlers={{
            dragend(event) {
              const marker =
                event.target as L.Marker;

              const posicion =
                marker.getLatLng();

              onCambiar({
                lat: posicion.lat,
                lng: posicion.lng,
              });
            },
          }}
        />

        <SelectorMapa
          onCambiar={onCambiar}
        />

      </MapContainer>

    </div>
  );
}