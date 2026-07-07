import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Spin } from 'antd';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeocodingService } from '@/features/shared/geocoding/services/geocoding.service';

export interface AddressMapRef {
    search: (address: string) => Promise<boolean>;
}

interface AddressMapProps {
    latitude: number | null;
    longitude: number | null;
    onCoordinatesChange: (lat: number, lng: number) => void;
    isSearching?: boolean;
}

const createIcon = () =>
    L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });

export const AddressMap = forwardRef<AddressMapRef, AddressMapProps>(
    ({ latitude, longitude, onCoordinatesChange, isSearching = false }, ref) => {
        const mapContainerRef = useRef<HTMLDivElement>(null);
        const mapInstanceRef = useRef<L.Map | null>(null);
        const markerRef = useRef<L.Marker | null>(null);
        const onCoordinatesChangeRef = useRef(onCoordinatesChange);

        useEffect(() => {
            onCoordinatesChangeRef.current = onCoordinatesChange;
        }, [onCoordinatesChange]);

        const initialCoordsRef = useRef({ lat: latitude ?? -34.6037, lng: longitude ?? -58.3816 });

        const placeMarker = useCallback((lat: number, lng: number) => {
            if (!mapInstanceRef.current) return;

            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                markerRef.current = L.marker([lat, lng], {
                    icon: createIcon(),
                    draggable: true,
                })
                    .addTo(mapInstanceRef.current)
                    .on('dragend', (e) => {
                        const pos = e.target.getLatLng();
                        onCoordinatesChangeRef.current(pos.lat, pos.lng);
                    });
            }
            mapInstanceRef.current.setView([lat, lng], 16);
        }, []);

        useEffect(() => {
            if (!mapContainerRef.current || mapInstanceRef.current) return;

            const map = L.map(mapContainerRef.current, {
                center: [initialCoordsRef.current.lat, initialCoordsRef.current.lng],
                zoom: 13,
                zoomControl: true,
                attributionControl: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            mapInstanceRef.current = map;

            return () => {
                mapInstanceRef.current?.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            };
        }, []);

        useEffect(() => {
            if (latitude !== null && longitude !== null && mapInstanceRef.current) {
                placeMarker(latitude, longitude);
            }
        }, [latitude, longitude, placeMarker]);

        const search = useCallback(async (address: string): Promise<boolean> => {
            if (!mapInstanceRef.current) return false;

            try {
                const result = await GeocodingService.searchAddress(address);
                placeMarker(result.latitude, result.longitude);
                onCoordinatesChangeRef.current(result.latitude, result.longitude);
                return true;
            } catch {
                return false;
            }
        }, [placeMarker]);

        useImperativeHandle(ref, () => ({ search }), [search]);

        return (
            <div className="relative">
                {isSearching && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                        <Spin size="large" />
                    </div>
                )}
                <div
                    ref={mapContainerRef}
                    style={{ height: 280, width: '100%', borderRadius: 8, zIndex: 0 }}
                />
            </div>
        );
    }
);

AddressMap.displayName = 'AddressMap';
