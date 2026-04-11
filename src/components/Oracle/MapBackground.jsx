import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

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
        <FlyTo lat={lat} lng={lng} onReady={onReady} />
      </MapContainer>
    </div>
  );
}
