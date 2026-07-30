import React, { useState, useEffect } from 'react';
import { locationRequestService } from '../../services/locationRequestService';
import { getCurrentLocation } from '../../utils/geofence';
import { Trash2, MapPin, Plus, Edit2, Search } from 'lucide-react';
import { Toast } from '../../components/common/Toast';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './StaffTimeEntry.css'; // Reusing styles

// Fix for default marker icon missing in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }: { position: any, setPosition: any }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng)
        },
    })
    return position === null ? null : (
        <Marker position={position}></Marker>
    )
}

const MapUpdater = ({ lat, lng }: { lat: string, lng: string }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([parseFloat(lat), parseFloat(lng)], 15);
        }
    }, [lat, lng, map]);
    return null;
}

export const StaffLocationRequests: React.FC = () => {
    const [locations, setLocations] = useState<any[]>([]);
    const [homeLocation, setHomeLocation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        locationName: '',
        type: 'Work',
        latitude: '',
        longitude: '',
        radius: '150',
        description: ''
    });

    const [gettingLocation, setGettingLocation] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [toast, setToast] = useState({ show: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await locationRequestService.getMyLocations();
            setLocations(res.data?.data?.requests || []);
            setHomeLocation(res.data?.data?.homeLocation || null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGetCurrentLocation = async () => {
        try {
            setGettingLocation(true);
            const loc = await getCurrentLocation();
            setFormData({
                ...formData,
                latitude: loc.latitude.toString(),
                longitude: loc.longitude.toString()
            });
        } catch (err: any) {
            setToast({ show: true, title: 'Error', message: err.message || 'Failed to get location', type: 'error' });
        } finally {
            setGettingLocation(false);
        }
    };

    const handleSearchLocation = async () => {
        if (!searchQuery.trim()) return;

        try {
            setIsSearching(true);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                setFormData({
                    ...formData,
                    latitude: data[0].lat,
                    longitude: data[0].lon
                });
                setToast({ show: true, title: 'Found', message: `Moved map to ${data[0].display_name.split(',')[0]}`, type: 'success' });
            } else {
                setToast({ show: true, title: 'Not Found', message: 'Could not find that location', type: 'error' });
            }
        } catch (err) {
            setToast({ show: true, title: 'Error', message: 'Failed to search location', type: 'error' });
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                latitude: undefined,
                longitude: undefined,
                coordinates: {
                    latitude: parseFloat(formData.latitude),
                    longitude: parseFloat(formData.longitude)
                },
                radius: parseInt(formData.radius) || 150
            };

            if (editingId) {
                await locationRequestService.update(editingId, payload);
                setToast({ show: true, title: 'Success', message: 'Location request updated successfully', type: 'success' });
            } else {
                await locationRequestService.create(payload);
                setToast({ show: true, title: 'Success', message: 'Location requested successfully', type: 'success' });
            }

            setShowModal(false);
            loadData();
        } catch (err: any) {
            setToast({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to request location', type: 'error' });
        }
    };

    const handleEdit = (req: any) => {
        setEditingId(req._id);
        setFormData({
            locationName: req.locationName,
            type: req.type,
            latitude: req.coordinates.latitude.toString(),
            longitude: req.coordinates.longitude.toString(),
            radius: req.radius.toString(),
            description: req.description
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            if (window.confirm('Are you sure you want to delete this requested location?')) {
                await locationRequestService.delete(id);
                setToast({ show: true, title: 'Deleted', message: 'Location deleted successfully', type: 'success' });
                loadData();
            }
        } catch (err: any) {
            setToast({ show: true, title: 'Error', message: err.response?.data?.message || 'Delete failed', type: 'error' });
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="fade-in">
            <div className="admin-header">
                <div>
                    <h1>My Check-In Locations</h1>
                    <p className="subtitle">Manage and request new locations for your shift check-ins</p>
                </div>
                <button className="btn-primary" onClick={() => {
                    setEditingId(null);
                    setSearchQuery('');
                    setFormData({ locationName: '', type: 'Work', latitude: '', longitude: '', radius: '150', description: '' });
                    setShowModal(true);
                }}>
                    <Plus size={16} /> Request Location
                </button>
            </div>

            {homeLocation && (
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}><MapPin size={20} color="var(--accent)" /> Admin Assigned Home Location</h3>
                    <p><strong>Label:</strong> {homeLocation.label || 'Home Location'}</p>
                    <p><strong>Coordinates:</strong> {homeLocation.coordinates.latitude}, {homeLocation.coordinates.longitude}</p>
                    <p><strong>Allowed Radius:</strong> {homeLocation.radius}m</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>This location is approved and active for remote check-ins.</p>
                </div>
            )}

            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Location Name</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Coordinates</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {locations.length === 0 ? (
                            <tr><td colSpan={6} className="empty-state">No requested locations</td></tr>
                        ) : (
                            locations.map(req => (
                                <tr key={req._id}>
                                    <td style={{ fontWeight: 500 }}>{req.locationName}</td>
                                    <td>{req.description}</td>
                                    <td>
                                        <span className={`status-badge ${req.type === 'Home' ? 'status-approved' : 'status-active'}`}>
                                            {req.type}
                                        </span>
                                    </td>
                                    <td>
                                        <a
                                            href={`https://www.google.com/maps?q=${req.coordinates.latitude},${req.coordinates.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', textDecoration: 'none' }}
                                        >
                                            <MapPin size={14} /> Map View (Lat: {req.coordinates.latitude.toFixed(4)})
                                        </a>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Radius: {req.radius}m</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${req.status.toLowerCase()}`}>
                                            {req.status}
                                        </span>
                                        {req.status === 'Rejected' && <div style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: '4px' }}>{req.rejectionReason}</div>}
                                    </td>
                                    <td>
                                        <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {req.status !== 'Approved' && (
                                                <button className="btn-icon" onClick={() => handleEdit(req)} title="Edit Request" style={{ color: 'var(--accent)' }}>
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                            {(req.status === 'Pending' || req.status === 'Approved' || req.status === 'Rejected') && (
                                                <button className="btn-icon" onClick={() => handleDelete(req._id)} title="Delete Request" style={{ color: 'var(--red)' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Request Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingId ? 'Edit Check-In Location' : 'Request Check-In Location'}</h2>
                                <p className="text-muted" style={{ margin: 0 }}>{editingId ? 'Modify your remote location request' : 'Submit a new location for admin approval'}</p>
                            </div>
                            <button type="button" onClick={() => setShowModal(false)} className="modal-close">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-body" style={{ textAlign: 'left' }}>
                            <div className="form-group">
                                <label className="form-label">Location Label *</label>
                                <input required type="text" className="input" value={formData.locationName} onChange={e => setFormData({ ...formData, locationName: e.target.value })} placeholder="e.g. Current Home Location / Remote Work Cafe" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Location Type *</label>
                                <select required className="select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="Work">Add Work Location</option>
                                    <option value="Home">Add Current Home Location</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                <label className="form-label">Select Location on Map *</label>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Search approximate location (e.g. Cochin Airport)"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchLocation())}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleSearchLocation}
                                        disabled={isSearching}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                                    >
                                        <Search size={16} /> {isSearching ? '...' : 'Search'}
                                    </button>
                                </div>

                                <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '10px' }}>
                                    <MapContainer
                                        center={[formData.latitude ? parseFloat(formData.latitude) : 10.196, formData.longitude ? parseFloat(formData.longitude) : 76.386]}
                                        zoom={13}
                                        style={{ height: "100%", width: "100%", zIndex: 1 }}
                                    >
                                        <TileLayer
                                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                                            attribution="&copy; Google Maps"
                                        />
                                        <LocationMarker
                                            position={(formData.latitude && formData.longitude) ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) } : null}
                                            setPosition={(latlng: any) => setFormData({ ...formData, latitude: latlng.lat.toString(), longitude: latlng.lng.toString() })}
                                        />
                                        <MapUpdater lat={formData.latitude} lng={formData.longitude} />
                                    </MapContainer>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Latitude *</label>
                                        <input required type="number" step="any" className="input" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Longitude *</label>
                                        <input required type="number" step="any" className="input" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} />
                                    </div>
                                </div>

                                <button type="button" onClick={handleGetCurrentLocation} disabled={gettingLocation} className="btn btn-secondary w-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
                                    <MapPin size={16} /> {gettingLocation ? 'Connecting to GPS...' : 'Use Current Device Location'}
                                </button>
                                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>
                                    (Alternatively, click on the map or enter coordinates manually)
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Geofence Radius (meters) *</label>
                                <input required type="number" min="10" className="input" value={formData.radius} onChange={e => setFormData({ ...formData, radius: e.target.value })} />
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Description/Reason *</label>
                                <textarea required rows={3} className="textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Working remotely this week." style={{ resize: 'vertical', width: '100%' }} />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Toast
                isOpen={toast.show}
                title={toast.title}
                message={toast.message}
                type={toast.type as any}
                duration={3000}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
};
