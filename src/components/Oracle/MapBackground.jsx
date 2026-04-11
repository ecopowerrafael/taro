import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const starIcon = L.divIcon({
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div style="font-size: 24px; color: #ffd700; filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.8));">✦</div>
      <div style="
        background: rgba(5, 0, 10, 0.75);
        color: #ffd700;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        white-space: nowrap;
        margin-top: 4px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        font-family: serif;
      ">Você nasceu aqui</div>
    </div>
  `,
  className: 'custom-star-icon',
  iconSize: [100, 50],
  iconAnchor: [50, 25],
});

function FlyTo({ lat, lng, onReady }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    map.flyTo([lat, lng], 12, { duration: 4 });
    setTimeout(() => onReady?.(), 4200);
  }, [lat, lng, map, onReady]);
  return null;
}

export function MapBackground({ lat, lng, onReady, zoomOut }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (zoomOut && mapRef.current) {
      mapRef.current.flyTo([lat, lng], 3, { duration: 3 });
    }
  }, [zoomOut, lat, lng]);

  return (
    <div
      className="fixed inset-0 z-0"
      style={{ filter: 'grayscale(30%) brightness(0.45) contrast(1.15)' }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={3}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <Marker position={[lat, lng]} icon={starIcon} />
        <FlyTo lat={lat} lng={lng} onReady={onReady} />
      </MapContainer>
    </div>
  );
}
