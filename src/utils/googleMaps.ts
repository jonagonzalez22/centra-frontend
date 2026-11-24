export type GoogleMapsApi = {
    Map: new (
        element: Element,
        options: Record<string, unknown>
    ) => { fitBounds: (bounds: unknown, padding?: number) => void };
    Marker: new (options: Record<string, unknown>) => unknown;
    Size: new (width: number, height: number) => unknown;
    Point: new (x: number, y: number) => unknown;
    Polyline: new (options: Record<string, unknown>) => unknown;
    LatLngBounds: new () => { extend: (value: unknown) => void; isEmpty: () => boolean };
    InfoWindow: new (options: Record<string, unknown>) => {
        open: (options: Record<string, unknown>) => void;
    };
    geometry: { encoding: { decodePath: (encoded: string) => unknown[] } };
    event: { addListener: (instance: unknown, event: string, handler: (event?: unknown) => void) => void };
};

declare global {
    interface Window {
        google?: { maps?: GoogleMapsApi };
    }
}

const SCRIPT_ID = 'centra-google-maps-js';
let loader: Promise<GoogleMapsApi> | null = null;

export const loadGoogleMaps = (): Promise<GoogleMapsApi> => {
    if (window.google?.maps) return Promise.resolve(window.google.maps);
    if (loader) return loader;
    const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY?.trim();
    if (!key) return Promise.reject(new Error('Google Maps no está configurado.'));
    loader = new Promise((resolve, reject) => {
        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener('load', () =>
                window.google?.maps
                    ? resolve(window.google.maps)
                    : reject(new Error('Google Maps no se pudo inicializar.'))
            );
            existing.addEventListener('error', () =>
                reject(new Error('No se pudo cargar Google Maps.'))
            );
            return;
        }
        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.async = true;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=geometry&language=es&region=AR&auth_referrer_policy=origin`;
        script.onload = () =>
            window.google?.maps
                ? resolve(window.google.maps)
                : reject(new Error('Google Maps no se pudo inicializar.'));
        script.onerror = () => reject(new Error('No se pudo cargar Google Maps.'));
        document.head.appendChild(script);
    });
    return loader;
};
