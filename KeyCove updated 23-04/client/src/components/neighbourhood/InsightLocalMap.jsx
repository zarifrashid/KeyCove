import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet'
import L from 'leaflet'

const propertyIcon = L.divIcon({
  className: 'neighbourhood-map-marker neighbourhood-map-marker-property',
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const placeIcon = L.divIcon({
  className: 'neighbourhood-map-marker neighbourhood-map-marker-place',
  html: '<span></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
})

function formatDistance(distanceMeters) {
  if (!distanceMeters && distanceMeters !== 0) return ''
  return distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`
}

export default function InsightLocalMap({ property, nearbyPlaces }) {
  const latitude = property?.location?.latitude
  const longitude = property?.location?.longitude

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return <p className="neighbourhood-inline-message">Map coordinates are not available for this property.</p>
  }

  return (
    <div className="neighbourhood-map-shell">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        zoomControl={false}
        className="neighbourhood-mini-map"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        <Marker position={[latitude, longitude]} icon={propertyIcon}>
          <Popup>
            <div className="popup-card">
              <strong>{property.title}</strong>
              <p className="popup-text">{property.location?.address}, {property.location?.area}</p>
            </div>
          </Popup>
        </Marker>

        {nearbyPlaces.map((place) => (
          <Marker key={`${place.category}-${place.name}`} position={[place.latitude, place.longitude]} icon={placeIcon}>
            <Popup>
              <div className="popup-card neighbourhood-popup-card">
                <strong>{place.name}</strong>
                <p className="popup-text">{place.category.replace('_', ' ')}</p>
                <p className="popup-text">{formatDistance(place.distanceMeters)}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
