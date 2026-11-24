export interface MapCoordinates {
    lat: number;
    lng: number;
}

const parseCoordinate = (value: unknown): number | null => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string' || value.trim() === '') return null;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
};

export const toMapCoordinates = (latitude: unknown, longitude: unknown): MapCoordinates | null => {
    const lat = parseCoordinate(latitude);
    const lng = parseCoordinate(longitude);

    if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return null;
    }

    return { lat, lng };
};
