import { Location, Driver, Order, OrderPriority } from './types';
import { getGoogleApiKey } from './services/apiConfig';

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

interface MapUrlOptions {
    center?: Location;
    business?: Location;
    route?: Location[];
    driver?: Driver;
    drivers?: Driver[];
    completedStops?: Location[];
    orders?: Order[];
}

export function generateGoogleMapsUrl(options: MapUrlOptions): string {
    const apiKey = getGoogleApiKey();
    if (!apiKey) {
        console.warn("API Key not found, returning placeholder image.");
        return `https://images.unsplash.com/photo-1563089201-419b16863678?q=80&w=1200&auto=format&fit=crop`;
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams();
    params.append('size', '600x400');
    params.append('maptype', 'roadmap');
    params.append('key', apiKey);
    
    // Dark mode style
    params.append('style', 'element:geometry|color:0x242f3e');
    params.append('style', 'element:labels.text.stroke|color:0x242f3e');
    params.append('style', 'element:labels.text.fill|color:0x746855');
    params.append('style', 'feature:administrative.locality|element:labels.text.fill|color:0xd59563');
    params.append('style', 'feature:poi|element:labels.text.fill|color:0xd59563');
    params.append('style', 'feature:poi.park|element:geometry|color:0x263c3f');
    params.append('style', 'feature:poi.park|element:labels.text.fill|color:0x6b9a76');
    params.append('style', 'feature:road|element:geometry|color:0x38414e');
    params.append('style', 'feature:road|element:geometry.stroke|color:0x212a37');
    params.append('style', 'feature:road|element:labels.text.fill|color:0x9ca5b3');
    params.append('style', 'feature:road.highway|element:geometry|color:0x746855');
    params.append('style', 'feature:road.highway|element:geometry.stroke|color:0x1f2835');
    params.append('style', 'feature:road.highway|element:labels.text.fill|color:0xf3d19c');
    params.append('style', 'feature:transit|element:geometry|color:0x2f3948');
    params.append('style', 'feature:transit.station|element:labels.text.fill|color:0xd59563');
    params.append('style', 'feature:water|element:geometry|color:0x17263c');
    params.append('style', 'feature:water|element:labels.text.fill|color:0x515c6d');
    params.append('style', 'feature:water|element:labels.text.stroke|color:0x17263c');

    // Path for route
    if (options.business && options.route && options.route.length > 0) {
        const path = `color:0x00aaff|weight:5|${options.business.lat},${options.business.lng}|${options.route.map(l => `${l.lat},${l.lng}`).join('|')}`;
        params.append('path', path);
    }
    
    // Markers
    const markers: string[] = [];
    if (options.business) {
        markers.push(`color:0x06b6d4|label:B|${options.business.lat},${options.business.lng}`);
    }
    
    if (options.route) {
        const completedAddresses = options.completedStops?.map(s => s.address) || [];
        options.route.forEach((stop, index) => {
             if (completedAddresses.includes(stop.address)) {
                markers.push(`color:0x22c55e|label:${index + 1}|${stop.lat},${stop.lng}`);
             } else {
                markers.push(`color:0xfbbf24|label:${index + 1}|${stop.lat},${stop.lng}`);
             }
        });
    }

    if(options.orders) {
      options.orders.forEach((order, index) => {
        if(order.location) {
          let color = '0xfbbf24'; // Yellow (Low)
          if (order.priority === OrderPriority.High) color = '0xff4500'; // Red-Orange (High)
          if (order.priority === OrderPriority.Medium) color = '0xffa500'; // Orange (Medium)
          markers.push(`color:${color}|label:${index + 1}|${order.location.lat},${order.location.lng}`);
        }
      });
    }

    if (options.driver?.currentLocation) {
        markers.push(`color:0xffffff|label:R|${options.driver.currentLocation.lat},${options.driver.currentLocation.lng}`);
    }
    if (options.drivers) {
        options.drivers.forEach(d => {
            if(d.currentLocation) {
                 markers.push(`color:0xffffff|label:${d.name.charAt(0)}|${d.currentLocation.lat},${d.currentLocation.lng}`);
            }
        });
    }

    markers.forEach(m => params.append('markers', m));
    
    return `${baseUrl}?${params.toString()}`;
}