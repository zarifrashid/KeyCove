import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'

const markerIcon = L.divIcon({
  className: 'custom-marker',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
})

function MapUpdater({ center, zoom, onBoundsChange }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])

  useEffect(() => {
    const handleMoveEnd = () => {
      const bounds = map.getBounds()
      onBoundsChange({
        northEastLat: bounds.getNorthEast().lat,
        northEastLng: bounds.getNorthEast().lng,
        southWestLat: bounds.getSouthWest().lat,
        southWestLng: bounds.getSouthWest().lng,
        center: map.getCenter(),
        zoom: map.getZoom()
      })
    }

    map.on('moveend', handleMoveEnd)
    handleMoveEnd()

    return () => {
      map.off('moveend', handleMoveEnd)
    }
  }, [map, onBoundsChange])

  return null
}

export default function PropertyMap({
  center,
  zoom,
  properties,
  selectedProperty,
  onSelectProperty,
  onBoundsChange
}) {
  return (
    <div className="map-shell">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        zoomControl={false}
        className="property-map"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <MapUpdater center={center} zoom={zoom} onBoundsChange={onBoundsChange} />

        {properties.map((property) => (
          <Marker
            key={property._id}
            position={[property.location.latitude, property.location.longitude]}
            icon={markerIcon}
            eventHandlers={{
              click: () => onSelectProperty(property)
            }}
          >
            <Popup>
              <div className="popup-card">
                <img src={property.image} alt={property.imageAlt} className="popup-image" />
                <div>
                  <strong>{property.title}</strong>
                  <p className="popup-text">৳ {property.price.toLocaleString()} / month</p>
                  <p className="popup-text">{property.location.area}, Dhaka</p>
                  <button className="popup-button" onClick={() => onSelectProperty(property)}>
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedProperty && (
        <div className="map-selected-pill">
          <span>{selectedProperty.title}</span>
          <strong>৳ {selectedProperty.price.toLocaleString()}</strong>
        </div>
      )}
    </div>
  )
}
