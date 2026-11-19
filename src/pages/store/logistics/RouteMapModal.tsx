import { Alert, Spin } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import type { DeliveryRoute } from '@/features/store/logistics/interfaces/route.interface';
import { RoutesService } from '@/features/store/logistics/services/routes.service';
import { loadGoogleMaps, type GoogleMapsApi } from '@/utils/googleMaps';

interface RouteMapModalProps {
    open: boolean;
    route: DeliveryRoute | null;
    onClose: () => void;
}

const popupContent = (stop: NonNullable<DeliveryRoute['stops']>[number]) => {
    const content = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = `#${stop.sequence} — ${stop.order?.operation_number || '—'}`;
    content.append(title);
    if (stop.order?.customer?.name)
        content.append(
            document.createElement('br'),
            document.createTextNode(`Cliente: ${stop.order.customer.name}`)
        );
    if (stop.estimated_arrival_at)
        content.append(
            document.createElement('br'),
            document.createTextNode(
                `Llegada est.: ${new Date(stop.estimated_arrival_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
            )
        );
    return content;
};

const storeMarkerIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="#0B2A52" stroke="#ffffff" stroke-width="2"/>
        <path d="M12 21h24v15H12z" fill="#ffffff"/>
        <path d="M10 20l3-8h22l3 8v3H10z" fill="#ffffff"/>
        <path d="M10 20h28" stroke="#0B2A52" stroke-width="2"/>
        <path d="M15 12v8M21 12v8M27 12v8M33 12v8" stroke="#0B2A52" stroke-width="2"/>
        <path d="M25 27h6v9h-6z" fill="#0B2A52"/>
        <path d="M16 27h5v5h-5z" fill="#0B2A52"/>
    </svg>
`)}`;

export const RouteMapModal = ({ open, route, onClose }: RouteMapModalProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);
    const [encodedPolyline, setEncodedPolyline] = useState<string | null>(null);
    const [loadingGeometry, setLoadingGeometry] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requestVersion, setRequestVersion] = useState(0);
    const hasStops = Boolean(route?.stops.some((stop) => stop.status !== 'cancelled'));

    useEffect(() => {
        if (!open) {
            setReady(false);
            setEncodedPolyline(null);
            setError(null);
            return;
        }
        const timer = window.setTimeout(() => setReady(true), 400);
        return () => window.clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (!open || !ready || !route?.id || !hasStops) {
            return;
        }
        const controller = new AbortController();
        setLoadingGeometry(true);
        setError(null);
        setEncodedPolyline(null);

        void RoutesService.getMapGeometry(route.id, controller.signal)
            .then((geometry) => setEncodedPolyline(geometry.encoded_polyline))
            .catch((reason: unknown) => {
                if (controller.signal.aborted) return;
                setError(
                    reason instanceof Error
                        ? reason.message
                        : 'No se pudo obtener el recorrido vial.'
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingGeometry(false);
            });

        return () => controller.abort();
    }, [hasStops, open, ready, requestVersion, route?.id]);

    useEffect(() => {
        if (!ready || !encodedPolyline || !route || !mapContainerRef.current) return;
        let cancelled = false;
        const container = mapContainerRef.current;

        const render = async () => {
            try {
                const maps: GoogleMapsApi = await loadGoogleMaps();
                if (cancelled) return;
                container.replaceChildren();
                const path = maps.geometry.encoding.decodePath(encodedPolyline);
                if (!path.length) throw new Error('La ruta no contiene una geometría válida.');
                const map = new maps.Map(container, {
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    gestureHandling: 'cooperative',
                });
                const bounds = new maps.LatLngBounds();
                path.forEach((point) => bounds.extend(point));
                new maps.Polyline({
                    path,
                    map,
                    strokeColor: '#1890ff',
                    strokeWeight: 4,
                    strokeOpacity: 0.8,
                });
                const storeMarker = new maps.Marker({
                    map,
                    position: path[0],
                    icon: {
                        url: storeMarkerIcon,
                        scaledSize: new maps.Size(44, 44),
                        anchor: new maps.Point(22, 22),
                    },
                    title: 'Tienda — Salida y regreso',
                });
                const storeInfo = new maps.InfoWindow({
                    content: 'Tienda — Salida y regreso',
                });
                maps.event.addListener(storeMarker, 'click', () =>
                    storeInfo.open({ map, anchor: storeMarker })
                );
                route.stops
                    .filter((stop) => stop.status !== 'cancelled')
                    .forEach((stop) => {
                        const lat = stop.order?.address?.latitude;
                        const lng = stop.order?.address?.longitude;
                        if (lat == null || lng == null) return;
                        const marker = new maps.Marker({
                            map,
                            position: { lat, lng },
                            label: {
                                text: String(stop.sequence),
                                color: '#ffffff',
                                fontWeight: '700',
                            },
                            title: `Parada ${stop.sequence}`,
                        });
                        const infoWindow = new maps.InfoWindow({ content: popupContent(stop) });
                        maps.event.addListener(marker, 'click', () =>
                            infoWindow.open({ map, anchor: marker })
                        );
                        bounds.extend({ lat, lng });
                    });
                if (!bounds.isEmpty()) map.fitBounds(bounds, 30);
            } catch (reason) {
                if (!cancelled)
                    setError(
                        reason instanceof Error ? reason.message : 'No se pudo mostrar el mapa.'
                    );
            }
        };

        void render();
        return () => {
            cancelled = true;
            container.replaceChildren();
        };
    }, [encodedPolyline, ready, route]);

    const retry = useCallback(() => setRequestVersion((version) => version + 1), []);
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Recorrido de la Ruta ${route?.id ? `#${route.id.substring(0, 8).toUpperCase()}` : ''}`}
            width={1200}
            footer={null}
            destroyOnClose
        >
            {!hasStops ? (
                <Alert type="warning" showIcon title="La ruta no tiene paradas activas para mostrar." />
            ) : null}
            {hasStops && !error ? (
                <div
                    style={{
                        minHeight: '70vh',
                        display: encodedPolyline ? 'block' : 'grid',
                        placeItems: 'center',
                    }}
                >
                    {loadingGeometry || !encodedPolyline ? (
                        <Spin description="Cargando recorrido..." />
                    ) : (
                        <div
                            ref={mapContainerRef}
                            style={{ width: '100%', height: '70vh', borderRadius: 8 }}
                        />
                    )}
                </div>
            ) : null}
            {error ? (
                <Alert
                    type="error"
                    showIcon
                    title="No se pudo mostrar el recorrido"
                    description={error}
                    action={<Button variant="default" label="Reintentar" action={retry} />}
                />
            ) : null}
        </Modal>
    );
};
