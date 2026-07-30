import React, { useEffect } from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useGeofence } from '../../contexts/GeofenceContext';

interface LocationOffWarningProps {
    onDismiss?: () => void;
    siteName?: string;
}

export const LocationOffWarning: React.FC<LocationOffWarningProps> = ({ siteName }) => {
    const { locationOffCountdown, setLocationOffWarningShown, onAutoCheckOut } = useGeofence();

    const handleOpenSettings = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    setLocationOffWarningShown(false);
                },
                () => {
                    console.log('Location still disabled after settings attempt');
                }
            );
        }
    };

    useEffect(() => {
        if (locationOffCountdown === 0) {
            setLocationOffWarningShown(false);
        }
    }, [locationOffCountdown, setLocationOffWarningShown]);

    if (locationOffCountdown === 0) return null;

    return (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 transition-all animate-in fade-in duration-500">
            <div className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.15)] flex flex-col max-w-sm w-full transform transition-all animate-in zoom-in-95 duration-500 min-h-[500px]">
                <div className="flex-1 flex flex-col items-center text-center p-10">
                    <div className="bg-orange-500/15 p-6 rounded-[2rem] mb-10 shadow-inner">
                        <AlertTriangle className="h-12 w-12 text-orange-600 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Location Off</h3>
                    <p className="text-gray-600 font-medium leading-relaxed text-[15px]">
                        You are currently checked into <strong className="text-gray-900">"{siteName || 'Unknown Site'}"</strong>.<br /><br />
                        You are now away from the geofencing area or your location is not accessible. Please get back in zone soon!
                    </p>
                </div>

                <div className="px-12 mb-10">
                    <div className="w-full bg-gray-100/50 rounded-full h-3 mb-4 overflow-hidden border border-gray-100/50 p-0.5">
                        <div
                            className="bg-orange-500 h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(249,115,22,0.6)]"
                            style={{ width: `${(locationOffCountdown / 30) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 text-center">
                        Auto-checkout in {locationOffCountdown}s
                    </p>
                </div>

                <div className="p-10 pt-0 flex gap-4">
                    <button
                        onClick={handleOpenSettings}
                        className="flex-1 px-4 py-5 text-sm font-extrabold text-orange-600 hover:bg-orange-50/50 bg-orange-50/30 rounded-2xl transition-all border border-orange-100/50 flex items-center justify-center gap-2 active:scale-95"
                    >
                        Enable
                    </button>

                    <button
                        onClick={() => {
                            setLocationOffWarningShown(false);
                            if (onAutoCheckOut) onAutoCheckOut();
                            else window.location.href = '/login';
                        }}
                        className="flex-2 px-6 py-5 text-sm font-extrabold bg-red-600 text-white rounded-2xl hover:bg-red-700 shadow-[0_15px_30px_rgba(239,68,68,0.35)] transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <LogOut size={20} />
                        Check Out
                    </button>
                </div>
            </div>
        </div>
    );
};
