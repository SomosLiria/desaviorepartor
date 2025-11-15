import { Driver, Order, Incident, Location, DriverStatus, OrderStatus, IncidentType } from './types';

export const BUSINESS_LOCATION: Location = {
  lat: 36.1408,
  lng: -5.4471,
  address: 'P.º Victoria Eugenia, 17, Algeciras, Cádiz',
};

export const DUMMY_DRIVERS: Driver[] = [
  {
    id: 1,
    name: 'Juan Pérez',
    status: DriverStatus.Active,
    pin: '1111',
    currentLocation: { lat: 36.1410, lng: -5.4475, address: 'Near Plaza Alta' },
    lastLocationUpdate: Date.now(),
  },
  {
    id: 2,
    name: 'María García',
    status: DriverStatus.Inactive,
    pin: '2222',
  },
  {
    id: 3,
    name: 'Carlos Rodríguez',
    status: DriverStatus.Active,
    pin: '3333',
    currentLocation: { lat: 36.138, lng: -5.446, address: 'Near business' },
    lastLocationUpdate: Date.now(),
  },
];

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();


export const DUMMY_ORDERS: Order[] = [
  { id: 101, name: 'Pedido para Ana', address: 'Calle Radio Algeciras, 5, Algeciras', status: OrderStatus.Assigned, assignedTo: 1, location: { lat: 36.135, lng: -5.45, address: 'Calle Radio Algeciras, 5, Algeciras' }, createdAt: oneHourAgo, },
  { id: 102, name: 'Pedido para Luis', address: 'Av. España, 12, San José Artesano, Algeciras', status: OrderStatus.Assigned, assignedTo: 1, location: { lat: 36.128, lng: -5.44, address: 'Av. España, 12, San José Artesano, Algeciras' }, createdAt: oneHourAgo, },
  { id: 103, name: 'Pedido para Marta', address: 'Paseo de la Conferencia, Algeciras', status: OrderStatus.Assigned, assignedTo: 3, location: { lat: 36.125, lng: -5.442, address: 'Paseo de la Conferencia, Algeciras' }, createdAt: twoHoursAgo, },
  { id: 104, name: 'Electrodomésticos Solac', address: 'Calle Real 90, Algeciras', status: OrderStatus.PendingAssignment, createdAt: new Date().toISOString(), location: { lat: 36.130, lng: -5.452, address: 'Calle Real 90, Algeciras' } },
  { id: 105, name: 'Librería El Cortijo', address: 'Plaza de Andalucía, Algeciras', status: OrderStatus.Delivered, assignedTo: 2, createdAt: yesterday, deliveredAt: new Date(new Date(yesterday).getTime() + 30 * 60 * 1000).toISOString(), location: { lat: 36.131, lng: -5.453, address: 'Plaza de Andalucía, Algeciras' } },
  { id: 106, name: 'Pastelería La Dificultosa', address: 'Av. Virgen del Carmen, Algeciras', status: OrderStatus.Delivered, assignedTo: 1, createdAt: threeDaysAgo, deliveredAt: new Date(new Date(threeDaysAgo).getTime() + 45 * 60 * 1000).toISOString(), location: { lat: 36.128, lng: -5.448, address: 'Av. Virgen del Carmen, Algeciras' } },
  { id: 107, name: 'Ferretería El Martillo', address: 'Calle Alfonso XI, Algeciras', status: OrderStatus.Delivered, assignedTo: 3, createdAt: lastWeek, deliveredAt: new Date(new Date(lastWeek).getTime() + 25 * 60 * 1000).toISOString(), location: { lat: 36.129, lng: -5.451, address: 'Calle Alfonso XI, Algeciras' } },
  { id: 108, name: 'Tienda de deportes "El Veloz"', address: 'Av. Blas Infante, Algeciras', status: OrderStatus.PendingAssignment, createdAt: twoWeeksAgo, location: { lat: 36.133, lng: -5.455, address: 'Av. Blas Infante, Algeciras' } }
];

export const DUMMY_INCIDENTS: Incident[] = [
    { id: 1, orderId: 101, driverId: 1, type: IncidentType.Manual, reason: 'El cliente no responde al teléfono.', timestamp: new Date().toISOString(), location: { lat: 36.135, lng: -5.45, address: 'Calle Ficticia 123' } },
];
