export type Coordinates = {
  lat: number;
  lng: number;
};

export type MapPin = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  kind: 'customer' | 'technician' | 'stop';
};

export function distanceMeters(from: Coordinates, to: Coordinates) {
  const earthRadius = 6371000;
  const latDelta = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDelta = ((to.lng - from.lng) * Math.PI) / 180;
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (to.lat * Math.PI) / 180;
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

export function etaMinutes(meters: number) {
  const hours = meters / 1000 / 25;
  return Math.max(1, Math.round(hours * 60));
}

export function cameraForPins(pins: MapPin[]) {
  if (pins.length === 0) return undefined;
  const latitudes = pins.map((pin) => pin.latitude);
  const longitudes = pins.map((pin) => pin.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latDelta = Math.max(maxLat - minLat, 0.005);
  const lngDelta = Math.max(maxLng - minLng, 0.005);
  const zoom = Math.max(3, Math.min(16, Math.log2(360 / Math.max(latDelta, lngDelta)) - 1));
  return {
    coordinates: {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
    },
    zoom,
  };
}
