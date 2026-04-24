import { MapContainer, Marker, TileLayer, ZoomControl } from 'react-leaflet'
import L from 'leaflet'

const miniMapIcon = L.divIcon({
  className: 'shared-board-mini-map-marker',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
})

export default function BoardItemMiniMap({ property }) {
  const latitude = property?.location?.latitude
  const longitude = property?.location?.longitude

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return <p className="shared-board-inline-message">Location preview is not available for this property.</p>
  }

  return (
    <div className="shared-board-mini-map-shell">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        className="shared-board-mini-map"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <Marker position={[latitude, longitude]} icon={miniMapIcon} />
      </MapContainer>
    </div>
  )
}
