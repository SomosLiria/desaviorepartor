import React, { useState, useEffect } from 'react';
import { UserRole, Driver, Order, Incident, Location, OrderStatus, DriverStatus, AppNotification } from './types';
import { DUMMY_DRIVERS, DUMMY_ORDERS, DUMMY_INCIDENTS, BUSINESS_LOCATION } from './dummyData';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import DriverView from './components/DriverView';
import { getDistanceFromLatLonInKm } from './utils';

interface User {
  role: UserRole;
  name: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>(DUMMY_DRIVERS);
  const [orders, setOrders] = useState<Order[]>(DUMMY_ORDERS);
  const [incidents, setIncidents] = useState<Incident[]>(DUMMY_INCIDENTS);
  const [businessLocation, setBusinessLocation] = useState<Location>(BUSINESS_LOCATION);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Driver location simulation & Automatic Route Start (Geofencing) effect
  useEffect(() => {
    const UPDATE_INTERVAL_MS = 2000;

    const interval = setInterval(() => {
      let driversUpdated = false;
      let ordersUpdated = false;

      const now = Date.now();
      const updatedDrivers = [...drivers];
      const updatedOrders = [...orders];

      updatedDrivers.forEach((driver, index) => {
        const hasAssignedOrders = updatedOrders.some(o => o.assignedTo === driver.id && o.status === OrderStatus.Assigned);
        const hasEnRouteOrders = updatedOrders.some(o => o.assignedTo === driver.id && o.status === OrderStatus.EnRoute);

        // --- Automatic Route Start Logic ---
        if (driver.status === DriverStatus.Active && hasAssignedOrders && !hasEnRouteOrders && driver.currentLocation) {
            const distanceFromBase = getDistanceFromLatLonInKm(
                driver.currentLocation.lat,
                driver.currentLocation.lng,
                businessLocation.lat,
                businessLocation.lng
            );

            if (distanceFromBase > 0.1) { // 100 meters
                const driverOrdersToStart = updatedOrders.filter(o => o.assignedTo === driver.id && o.status === OrderStatus.Assigned);
                if (driverOrdersToStart.length > 0) {
                    const routeOrderAddresses = driver.route?.map(loc => loc.address) || [];
                    const firstOrder = driverOrdersToStart.sort((a,b) => routeOrderAddresses.indexOf(a.address) - routeOrderAddresses.indexOf(b.address))[0];
                    
                    const orderIndex = updatedOrders.findIndex(o => o.id === firstOrder.id);
                    if(orderIndex !== -1) {
                        updatedOrders[orderIndex] = { ...updatedOrders[orderIndex], status: OrderStatus.EnRoute };
                        ordersUpdated = true;
                    }
                }
            }
        }
        
        // --- Location Simulation Logic ---
        if (driver.status === DriverStatus.Active && driver.route && driver.route.length > 0) {
          const nextStopOrder = updatedOrders.find(o => o.status === OrderStatus.EnRoute && o.assignedTo === driver.id);
          const nextStop = nextStopOrder?.location;

          if (nextStop) {
              const currentLocation = driver.currentLocation || businessLocation;
              const lastUpdate = driver.lastLocationUpdate || (now - UPDATE_INTERVAL_MS);
              const timeElapsedSeconds = (now - lastUpdate) / 1000;

              const totalDistance = getDistanceFromLatLonInKm(currentLocation.lat, currentLocation.lng, nextStop.lat, nextStop.lng);

              const SIMULATED_SPEED_KPH = 40; // City speed
              const distanceMoved = SIMULATED_SPEED_KPH * (timeElapsedSeconds / 3600);
              
              let newLat, newLng;

              if (totalDistance <= distanceMoved) {
                  // Arrived at destination
                  newLat = nextStop.lat;
                  newLng = nextStop.lng;
              } else {
                  // Move towards destination
                  const fractionToMove = distanceMoved / totalDistance;
                  newLat = currentLocation.lat + (nextStop.lat - currentLocation.lat) * fractionToMove;
                  newLng = currentLocation.lng + (nextStop.lng - currentLocation.lng) * fractionToMove;
              }
              
              const newLocation = { ...currentLocation, lat: newLat, lng: newLng };
              
              if (currentLocation.lat !== newLat || currentLocation.lng !== newLng) {
                updatedDrivers[index] = { ...driver, currentLocation: newLocation, lastLocationUpdate: now };
                driversUpdated = true;
              }
          }
        }
      });
      
      if (driversUpdated) setDrivers(updatedDrivers);
      if (ordersUpdated) setOrders(updatedOrders);

    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [drivers, orders, businessLocation]);

  const handleLogin = (role: UserRole, name: string) => {
    setUser({ role, name });
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} drivers={drivers} />;
  }

  if (user.role === UserRole.Admin) {
    return (
      <Dashboard
        userName={user.name}
        onLogout={handleLogout}
        drivers={drivers}
        setDrivers={setDrivers}
        orders={orders}
        setOrders={setOrders}
        incidents={incidents}
        setIncidents={setIncidents}
        businessLocation={businessLocation}
        setBusinessLocation={setBusinessLocation}
        notifications={notifications}
        setNotifications={setNotifications}
      />
    );
  }

  if (user.role === UserRole.Repartidor) {
    const currentDriver = drivers.find(d => d.name === user.name);
    if (currentDriver) {
        return (
            <DriverView
                driver={currentDriver}
                setDriver={(updatedDriver) => setDrivers(prev => prev.map(d => d.id === updatedDriver.id ? updatedDriver : d))}
                orders={orders.filter(o => o.assignedTo === currentDriver.id)}
                setOrders={setOrders}
                incidents={incidents}
                setIncidents={setIncidents}
                onLogout={handleLogout}
                businessLocation={businessLocation}
                notifications={notifications.filter(n => !n.readBy.includes(currentDriver.id!))}
                markNotificationsAsRead={() => setNotifications(prev => prev.map(n => ({...n, readBy: [...n.readBy, currentDriver.id!]})))}
            />
        );
    }
  }

  // Fallback or error case
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      Error: No se pudo cargar la vista para el usuario.
      <button onClick={handleLogout} className="ml-4 p-2 bg-red-500 rounded">Logout</button>
    </div>
  );
};

export default App;