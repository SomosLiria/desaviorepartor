export enum UserRole {
  Admin = 'Admin',
  Repartidor = 'Repartidor',
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export enum DriverStatus {
  Inactive = 'inactive',
  Active = 'active',
}

export interface Driver {
  id: number;
  name: string;
  status: DriverStatus;
  pin?: string; // 4-digit PIN for login
  currentLocation?: Location;
  route?: Location[];
  routeConfirmed?: boolean;
  lastLocationUpdate?: number; // Timestamp of the last location update
}

export enum OrderStatus {
  PendingAssignment = 'Pendiente de Asignar',
  Assigned = 'Asignado',
  EnRoute = 'En Ruta',
  Delivered = 'Entregado',
}

export enum OrderPriority {
  High = 'Alta',
  Medium = 'Media',
  Low = 'Baja',
}

export interface Order {
  id: number;
  name: string;
  address: string;
  notes?: string;
  status: OrderStatus;
  assignedTo?: number; // Driver ID
  location?: Location;
  deliveryTime?: number; // in minutes
  createdAt: string; // ISO 8601 date string
  deliveredAt?: string; // ISO 8601 date string
  priority?: OrderPriority;
  proofOfDeliveryImageUrl?: string; // URL or Base64 string of the image
}

export enum IncidentType {
  Automatic = 'Automática',
  Manual = 'Manual',
}

export interface Incident {
  id: number;
  orderId: number;
  driverId: number;
  type: IncidentType;
  reason: string;
  timestamp: string;
  location: Location;
}

export interface AppNotification {
  id: number;
  message: string;
  timestamp: string;
  readBy: number[]; // Array of driver IDs who have read it
}
