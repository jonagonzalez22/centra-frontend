import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Modal from '@/components/Modal/Modal';
import { decodePolyline } from '@/utils/decodePolyline';
import type { DeliveryRoute } from '@/features/store/logistics/interfaces/route.interface';

interface RouteMapModalProps {
    open: boolean;
    route: DeliveryRoute | null;
    onClose: () => void;
}

const createStopIcon = (sequence: number) =>
    L.divIcon({
        html: `<div style="background:#1890ff;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${sequence}</div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });

const createStoreIcon = () =>
    L.divIcon({
        html: '<div style="background:#52c41a;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🏪</div>',
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });

export const RouteMapModal = ({ open, route, onClose }: RouteMapModalProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [ready, setReady] = useState(false);

    // Wait for modal animation to finish before rendering the map
    useEffect(() => {
        if (!open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setReady(false);
            return;
        }
        const timer = setTimeout(() => setReady(true), 400);
        return () => clearTimeout(timer);
    }, [open]);

    // Build map once ready and route data is available
    useEffect(() => {
        if (!ready || !route?.encoded_polyline || !mapContainerRef.current) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
        }

        const map = L.map(mapContainerRef.current, {
            zoomControl: true,
            attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const decoded = decodePolyline(route.encoded_polyline);
        const polyline = L.polyline(decoded, {
            color: '#1890ff',
            weight: 4,
            opacity: 0.8,
        }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

        if (decoded.length > 0) {
            L.marker(decoded[0], { icon: createStoreIcon() })
                .addTo(map)
                .bindPopup('Punto de salida (Tienda)');
        }

        const activeStops = (route.stops ?? []).filter((s) => s.status !== 'cancelled');
        activeStops.forEach((stop) => {
            const lat = stop.order?.address?.latitude;
            const lng = stop.order?.address?.longitude;
            if (lat != null && lng != null) {
                const popupContent = [
                    `#${stop.sequence} — ${stop.order?.operation_number || '—'}`,
                    stop.order?.customer?.name ? `Cliente: ${stop.order.customer.name}` : null,
                    stop.estimated_arrival_at
                        ? `Llegada est.: ${new Date(stop.estimated_arrival_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
                        : null,
                ].filter(Boolean).join('<br>');

                L.marker([lat, lng], { icon: createStopIcon(stop.sequence) })
                    .addTo(map)
                    .bindPopup(popupContent);
            }
        });

        mapInstanceRef.current = map;

        setTimeout(() => map.invalidateSize(), 100);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [ready, route]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Recorrido de la Ruta ${route?.id ? '#' + route.id.substring(0, 8).toUpperCase() : ''}`}
            width={1200}
            footer={null}
            destroyOnClose
        >
            <div
                ref={mapContainerRef}
                style={{ width: '100%', height: '70vh', borderRadius: 8 }}
            />
        </Modal>
    );
};
