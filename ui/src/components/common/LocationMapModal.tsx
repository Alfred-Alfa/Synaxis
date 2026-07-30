import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    coordinates?: { latitude: number, longitude: number } | null | undefined;
}

const MapUpdater = ({ lat, lng }: { lat: number, lng: number }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], 15);
    }, [lat, lng, map]);
    return null;
};

export const LocationMapModal: React.FC<LocationMapModalProps> = ({ isOpen, onClose, coordinates }) => {
    if (!isOpen || !coordinates) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="modal-content" style={{
                background: 'white', borderRadius: '8px', width: '90%', maxWidth: '600px',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>Location Preview</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: '4px', borderRadius: '4px' }}>
                        <X size={20} />
                    </button>
                </div>
                <div style={{ height: '400px', width: '100%', position: 'relative' }}>
                    <MapContainer
                        center={[coordinates.latitude, coordinates.longitude]}
                        zoom={16}
                        style={{ height: '100%', width: '100%', zIndex: 1 }}
                    >
                        <TileLayer
                            url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                            attribution="&copy; Google Maps"
                        />
                        <Marker position={[coordinates.latitude, coordinates.longitude]} />
                        <MapUpdater lat={coordinates.latitude} lng={coordinates.longitude} />
                    </MapContainer>
                </div>
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div className="text-muted text-sm font-mono" style={{ color: '#475569' }}>
                        {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                    </div>
                    <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 500 }}>
                        Close Map
                    </button>
                </div>
            </div>
        </div>
    );
};
