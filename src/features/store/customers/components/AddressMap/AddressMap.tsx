import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Alert, Spin } from 'antd';
import { loadGoogleMaps, type GoogleMapsApi } from '@/utils/googleMaps';
import { GeocodingService } from '@/features/shared/geocoding/services/geocoding.service';
import type { GeocodingResult } from '@/features/shared/geocoding/interfaces/geocoding.types';
import { toMapCoordinates, type MapCoordinates } from './coordinates';

export interface AddressMapRef { search: (address: string) => Promise<GeocodingResult | null>; }
interface AddressMapProps { latitude: unknown; longitude: unknown; onCoordinatesChange?: (lat: number, lng: number) => void; isSearching?: boolean; readOnly?: boolean; }
interface MarkerLike { setPosition: (position: { lat: number; lng: number }) => void; setDraggable: (draggable: boolean) => void; getPosition: () => { lat: () => number; lng: () => number } | null; }

const DEFAULT_CENTER: MapCoordinates = { lat: -32.8895, lng: -68.8458 };

export const AddressMap = forwardRef<AddressMapRef, AddressMapProps>(
    ({ latitude, longitude, onCoordinatesChange, isSearching = false, readOnly = false }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const mapRef = useRef<unknown>(null);
        const markerRef = useRef<MarkerLike | null>(null);
        const mapsRef = useRef<GoogleMapsApi | null>(null);
        const callbackRef = useRef(onCoordinatesChange);
        const [error, setError] = useState<string | null>(null);
        const coordinates = useMemo(() => toMapCoordinates(latitude, longitude), [latitude, longitude]);
        const hasCoordinateInput = latitude !== null && latitude !== undefined
            || longitude !== null && longitude !== undefined;
        const invalidCoordinates = hasCoordinateInput && coordinates === null;
        useEffect(() => { callbackRef.current = onCoordinatesChange; }, [onCoordinatesChange]);

        const placeMarker = useCallback((lat: number, lng: number) => {
            const maps = mapsRef.current;
            if (!maps || !mapRef.current) return;
            const position = toMapCoordinates(lat, lng);
            if (!position) return;
            if (markerRef.current) {
                markerRef.current.setPosition(position);
                markerRef.current.setDraggable(!readOnly);
            } else {
                const marker = new maps.Marker({ map: mapRef.current, position, draggable: !readOnly, title: 'Ubicación de entrega' }) as MarkerLike;
                maps.event.addListener(marker, 'dragend', () => {
                    const point = marker.getPosition();
                    if (point && !readOnly) callbackRef.current?.(point.lat(), point.lng());
                });
                markerRef.current = marker;
            }
            const map = mapRef.current as { setCenter?: (point: { lat: number; lng: number }) => void; setZoom?: (zoom: number) => void };
            map.setCenter?.(position);
            map.setZoom?.(16);
        }, [readOnly]);

        useEffect(() => {
            if (!containerRef.current || mapRef.current) return;
            let active = true;
            void loadGoogleMaps().then((maps) => {
                if (!active || !containerRef.current) return;
                mapsRef.current = maps;
                mapRef.current = new maps.Map(containerRef.current, {
                    center: coordinates ?? DEFAULT_CENTER, zoom: coordinates ? 16 : 11,
                    mapTypeControl: false, streetViewControl: false, fullscreenControl: true, gestureHandling: 'cooperative',
                });
                if (!readOnly) {
                    maps.event.addListener(mapRef.current, 'click', (event?: unknown) => {
                        const point = event as { latLng?: { lat: () => number; lng: () => number } } | undefined;
                        if (!point?.latLng) return;

                        const position = toMapCoordinates(point.latLng.lat(), point.latLng.lng());
                        if (!position) return;

                        placeMarker(position.lat, position.lng);
                        callbackRef.current?.(position.lat, position.lng);
                    });
                }
                if (coordinates) placeMarker(coordinates.lat, coordinates.lng);
            }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar Google Maps.'));
            return () => { active = false; mapRef.current = null; markerRef.current = null; };
        }, [coordinates, placeMarker]);
        useEffect(() => { if (coordinates) placeMarker(coordinates.lat, coordinates.lng); }, [coordinates, placeMarker]);

        const search = useCallback(async (address: string) => {
            if (readOnly) return null;
            try { const result = await GeocodingService.searchAddress(address); placeMarker(result.latitude, result.longitude); return result; } catch { return null; }
        }, [placeMarker, readOnly]);
        useImperativeHandle(ref, () => ({ search }), [search]);

        return <div className="relative">
            {isSearching && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70"><Spin size="large" /></div>}
            {error ? <Alert type="warning" showIcon message={error} className="mb-2" /> : null}
            {invalidCoordinates ? <Alert type="warning" showIcon message="Este domicilio todavía no tiene una ubicación válida." className="mb-2" /> : null}
            <div ref={containerRef} style={{ height: 280, width: '100%', borderRadius: 8, zIndex: 0 }} />
        </div>;
    }
);
AddressMap.displayName = 'AddressMap';
