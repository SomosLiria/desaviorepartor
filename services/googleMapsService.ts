import { Location, Order, OrderPriority } from '../types';
import { getGoogleApiKey } from './apiConfig';

export interface AddressValidationResult {
  isValid: boolean;
  formattedAddress: string;
  lat?: number;
  lng?: number;
  warning?: string;
}

const API_BASE_URL = 'https://maps.googleapis.com/maps/api';

export const geocodeAddress = async (address: string): Promise<AddressValidationResult> => {
    const apiKey = getGoogleApiKey();
    if (!apiKey) {
        return { isValid: false, formattedAddress: address, warning: 'API Key no configurada.' };
    }
    
    const encodedAddress = encodeURIComponent(address);
    // Bias results to Algeciras, Cádiz, Spain for better accuracy
    const url = `${API_BASE_URL}/geocode/json?address=${encodedAddress}&key=${apiKey}&components=administrative_area:Andalucía|country:ES|locality:Algeciras`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            const location = result.geometry.location;

            const isAlgeciras = result.address_components.some(
                (comp: any) => comp.types.includes('locality') && comp.long_name === 'Algeciras'
            );

            if (!isAlgeciras) {
                return { isValid: false, formattedAddress: address, warning: 'La dirección parece estar fuera de Algeciras.' };
            }

            return {
                isValid: true,
                formattedAddress: result.formatted_address,
                lat: location.lat,
                lng: location.lng,
            };
        } else {
            return { isValid: false, formattedAddress: address, warning: 'Dirección no encontrada o inválida.' };
        }
    } catch (error) {
        console.error("Error calling Geocoding API:", error);
        return { isValid: false, formattedAddress: address, warning: 'Error de red al validar la dirección.' };
    }
};

export const optimizeRoute = async (startLocation: Location, orders: Order[]): Promise<Location[] | null> => {
    const apiKey = getGoogleApiKey();
    if (!apiKey) {
        console.error("Google Maps API Key not found.");
        return null;
    }
    if (orders.length === 0) {
        return [];
    }

    const highPriorityOrders = orders.filter(o => o.priority === OrderPriority.High);
    const normalPriorityOrders = orders.filter(o => o.priority !== OrderPriority.High);

    if (normalPriorityOrders.length <= 1) {
        // No optimization needed for 0 or 1 normal priority orders
        const finalOrder = [...highPriorityOrders, ...normalPriorityOrders];
        return finalOrder.map(o => o.location!);
    }

    const origin = `${startLocation.lat},${startLocation.lng}`;
    const destination = origin; // Round trip
    const waypoints = normalPriorityOrders.map(o => `${o.location!.lat},${o.location!.lng}`).join('|');

    const url = `${API_BASE_URL}/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.routes.length > 0) {
            const route = data.routes[0];
            const optimizedWaypointOrder: number[] = route.waypoint_order;

            const optimizedNormalOrders = optimizedWaypointOrder.map(index => normalPriorityOrders[index]);
            
            const finalSortedOrders = [...highPriorityOrders, ...optimizedNormalOrders];
            return finalSortedOrders.map(o => o.location!);

        } else {
            console.error("Directions API error:", data.error_message || data.status);
            // Fallback to unoptimized list on API error
            return orders.map(o => o.location!);
        }
    } catch (error) {
        console.error("Error calling Directions API:", error);
        return null;
    }
};
