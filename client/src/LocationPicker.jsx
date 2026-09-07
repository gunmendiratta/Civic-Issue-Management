import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Autocomplete, GoogleMap, LoadScript, MarkerF } from '@react-google-maps/api'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }
const libraries = ['places']
const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY

function MapController({ coordinates }) {
  const map = useMap()
  useEffect(() => { if (coordinates) map.setView([coordinates[1], coordinates[0]], Math.max(map.getZoom(), 15)) }, [coordinates, map])
  return null
}

function LocationEvents({ onSelect }) {
  useMapEvents({ click: (event) => onSelect(event.latlng.lat, event.latlng.lng) })
  return null
}

function LocationSummary({ form, confirmed, setConfirmed }) {
  const coordinates = form.latitude && form.longitude
  return <>{coordinates ? <div className="selected-location"><span>Selected issue location</span><b>{form.address || 'Add the nearest address or landmark'}</b><small>Latitude {form.latitude} · Longitude {form.longitude}</small></div> : <p className="location-hint">Search for a place, click the map, or use your current location to place the issue marker.</p>}<button type="button" className={confirmed ? 'secondary confirmed-location' : 'primary'} disabled={!coordinates || !form.address} onClick={() => setConfirmed(true)}>{confirmed ? 'Location confirmed' : 'Confirm issue location'}</button></>
}

export default function LocationPicker({ form, setForm, confirmed, setConfirmed, setError }) {
  const [autocomplete, setAutocomplete] = useState(null)
  const selectLocation = (latitude, longitude, address = form.address) => { setForm((current) => ({ ...current, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6), address: address || current.address })); setConfirmed(false) }
  const useCurrentLocation = () => { if (!navigator.geolocation) return setError('Location is not supported by this browser.'); navigator.geolocation.getCurrentPosition(({ coords }) => selectLocation(coords.latitude, coords.longitude), () => setError('Location access was unavailable. You can select the issue location on the map.')) }
  const handlePlace = () => { const place = autocomplete?.getPlace(); const location = place?.geometry?.location; if (!location) return setError('Choose a complete place from the search results.'); selectLocation(location.lat(), location.lng(), place.formatted_address || place.name); }
  const coordinates = form.latitude && form.longitude ? { lat: Number(form.latitude), lng: Number(form.longitude) } : null
  return <section className="location-picker"><div className="location-picker-head"><div><div className="eyebrow">Complaint location</div><h2>Where is the problem?</h2><p>Choose the location of the civic issue, not necessarily where you are standing.</p></div><button type="button" className="secondary" onClick={useCurrentLocation}>Use my current location</button></div>{googleKey ? <LoadScript googleMapsApiKey={googleKey} libraries={libraries}><Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlace}><label className="full">Search for the issue location<input required value={form.address} onChange={(event) => { setForm({ ...form, address: event.target.value }); setConfirmed(false) }} placeholder="Search an address, road, landmark or intersection" /></label></Autocomplete><div className="location-map google-location-map"><GoogleMap center={coordinates || DEFAULT_CENTER} zoom={coordinates ? 16 : 11} mapContainerStyle={{ width: '100%', height: '100%' }} onClick={(event) => event.latLng && selectLocation(event.latLng.lat(), event.latLng.lng())}>{coordinates && <MarkerF position={coordinates} draggable onDragEnd={(event) => event.latLng && selectLocation(event.latLng.lat(), event.latLng.lng())} />}</GoogleMap></div></LoadScript> : <><label className="full">Issue address<input required value={form.address} onChange={(event) => { setForm({ ...form, address: event.target.value }); setConfirmed(false) }} placeholder="Enter the issue address or nearest landmark" /></label><div className="location-map"><MapContainer center={coordinates ? [coordinates.lat, coordinates.lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]} zoom={coordinates ? 15 : 11} scrollWheelZoom><TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><LocationEvents onSelect={selectLocation} /><MapController coordinates={coordinates ? [coordinates.lng, coordinates.lat] : null} />{coordinates && <CircleMarker center={[coordinates.lat, coordinates.lng]} radius={11} pathOptions={{ color: '#176b4b', fillColor: '#dff2e8', fillOpacity: 0.95 }} />}</MapContainer></div></>}<LocationSummary form={form} confirmed={confirmed} setConfirmed={setConfirmed} /></section>
}
