import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import Navbar from '../components/Navbar'

const DHAKA_CENTER = {
  latitude: 23.8103,
  longitude: 90.4125
}

const pickerIcon = L.divIcon({
  className: 'property-location-picker-marker',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

function parseCoordinate(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function isValidCoordinate(latitude, longitude) {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
        label: 'Pinned location selected from map'
      })
    }
  })

  return null
}

function MapViewUpdater({ center, zoom }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, map, zoom])

  return null
}

export default function PropertyLocationPickerPage() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const returnKey = searchParams.get('returnKey') || ''
  const initialQuery = searchParams.get('query') || ''
  const rawInitialLatitude = searchParams.get('lat')
  const rawInitialLongitude = searchParams.get('lng')
  const initialLatitude = parseCoordinate(rawInitialLatitude, DHAKA_CENTER.latitude)
  const initialLongitude = parseCoordinate(rawInitialLongitude, DHAKA_CENTER.longitude)
  const hasInitialCoordinates = rawInitialLatitude !== null && rawInitialLongitude !== null && isValidCoordinate(Number(rawInitialLatitude), Number(rawInitialLongitude))

  const [mapCenter, setMapCenter] = useState([initialLatitude, initialLongitude])
  const [mapZoom, setMapZoom] = useState(hasInitialCoordinates ? 16 : 12)
  const [selectedLocation, setSelectedLocation] = useState(hasInitialCoordinates
    ? {
      latitude: initialLatitude,
      longitude: initialLongitude,
      label: initialQuery || 'Current selected property location'
    }
    : null)
  const [searchText, setSearchText] = useState(initialQuery)
  const [searchResults, setSearchResults] = useState([])
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })

  const selectLocation = ({ latitude, longitude, label = '' }) => {
    if (!isValidCoordinate(latitude, longitude)) return

    setSelectedLocation({ latitude, longitude, label })
    setMapCenter([latitude, longitude])
    setMapZoom(17)
    setStatus({ loading: false, error: '', success: 'Location pin selected. Click Confirm Location to return it to the property form.' })
  }

  const handleSearch = async (event) => {
    event.preventDefault()
    const query = searchText.trim()
    if (!query) {
      setStatus({ loading: false, error: 'Please enter an address or area to search.', success: '' })
      return
    }

    try {
      setStatus({ loading: true, error: '', success: '' })
      const params = new URLSearchParams({
        format: 'json',
        limit: '5',
        countrycodes: 'bd',
        q: query
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`)
      if (!response.ok) throw new Error('Location search failed.')
      const results = await response.json()
      setSearchResults(Array.isArray(results) ? results : [])
      setStatus({
        loading: false,
        error: Array.isArray(results) && results.length ? '' : 'No matching location found. You can still click directly on the map.',
        success: Array.isArray(results) && results.length ? 'Select a result below or click directly on the map.' : ''
      })
    } catch (error) {
      setStatus({ loading: false, error: error.message || 'Location search failed. You can still click directly on the map.', success: '' })
    }
  }

  const handleResultClick = (result) => {
    selectLocation({
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      label: result.display_name || searchText.trim()
    })
  }

  const handleConfirm = () => {
    if (!returnKey) {
      setStatus({ loading: false, error: 'Unable to return this location to the property form. Please reopen the picker from Add Property.', success: '' })
      return
    }

    if (!selectedLocation || !isValidCoordinate(selectedLocation.latitude, selectedLocation.longitude)) {
      setStatus({ loading: false, error: 'Please choose a location on the map first.', success: '' })
      return
    }

    localStorage.setItem(returnKey, JSON.stringify({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      label: selectedLocation.label || searchText.trim() || 'Location selected successfully',
      selectedAt: new Date().toISOString()
    }))
    setStatus({ loading: false, error: '', success: 'Location confirmed. You can return to the Add Property form.' })
    window.close()
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap property-location-picker-wrap">
        <div className="card property-location-picker-card">
          <div className="property-section-heading">
            <p className="badge">Manager Location Picker</p>
            <h1>Choose Property Location</h1>
            <p>Search an area or click directly on the map to place the exact property pin.</p>
          </div>

          <form className="property-location-search-row" onSubmit={handleSearch}>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search address, area, or city"
            />
            <button type="submit" className="secondary-btn" disabled={status.loading}>
              {status.loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {status.error ? <p className="error-text property-location-picker-message">{status.error}</p> : null}
          {status.success ? <p className="success-text property-location-picker-message">{status.success}</p> : null}

          {searchResults.length ? (
            <div className="property-location-results">
              {searchResults.map((result) => (
                <button
                  type="button"
                  key={`${result.place_id}-${result.lat}-${result.lon}`}
                  className="property-location-result-btn"
                  onClick={() => handleResultClick(result)}
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          ) : null}

          <div className="property-location-picker-map-shell">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom
              zoomControl={false}
              className="property-location-picker-map"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />
              <MapViewUpdater center={mapCenter} zoom={mapZoom} />
              <MapClickHandler onSelect={selectLocation} />
              {selectedLocation ? (
                <Marker
                  position={[selectedLocation.latitude, selectedLocation.longitude]}
                  icon={pickerIcon}
                  draggable
                  eventHandlers={{
                    dragend(event) {
                      const marker = event.target
                      const position = marker.getLatLng()
                      selectLocation({
                        latitude: position.lat,
                        longitude: position.lng,
                        label: selectedLocation.label || 'Pinned location selected from map'
                      })
                    }
                  }}
                />
              ) : null}
            </MapContainer>
          </div>

          <div className="property-location-picker-actions">
            <button type="button" className="primary-btn" onClick={handleConfirm} disabled={!selectedLocation}>
              Confirm Location
            </button>
            <button type="button" className="secondary-btn" onClick={() => window.close()}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
