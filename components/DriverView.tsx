import React, { useState, useMemo, useRef } from 'react';
import { Driver, Order, Incident, Location, DriverStatus, OrderStatus, IncidentType, AppNotification } from '../types';
import { generateGoogleMapsUrl, getDistanceFromLatLonInKm } from '../utils';
import { LogoutIcon, RouteIcon, PlayIcon, CheckCircleIcon, WarningIcon, PackageIcon, BusinessIcon, BellIcon, CameraIcon } from './icons/Icons';

interface DriverViewProps {
  driver: Driver;
  setDriver: (driver: Driver) => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  onLogout: () => void;
  businessLocation: Location;
  notifications: AppNotification[];
  markNotificationsAsRead: () => void;
}

const DriverView: React.FC<DriverViewProps> = ({
  driver, setDriver, orders, setOrders, setIncidents,
  onLogout, businessLocation, notifications, markNotificationsAsRead
}) => {
  const [showIncidentForm, setShowIncidentForm] = useState<number | null>(null);
  const [incidentReason, setIncidentReason] = useState('');
  const [distanceWarning, setDistanceWarning] = useState<{ title: string; message: string } | null>(null);
  const [timeWarning, setTimeWarning] = useState<Order | null>(null);
  const [orderForProof, setOrderForProof] = useState<Order | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsToShow, setNotificationsToShow] = useState<AppNotification[]>([]);

  const { sortedOrders, nextOrder, completedOrders, allOrdersDelivered } = useMemo(() => {
    const driverOrders = orders.filter(o => o.assignedTo === driver.id);
    if (!driver.route || driver.route.length === 0) {
        const next = driverOrders.find(o => o.status === OrderStatus.EnRoute);
        const completed = driverOrders.filter(o => o.status === OrderStatus.Delivered);
        const allDelivered = driverOrders.length > 0 && driverOrders.every(o => o.status === OrderStatus.Delivered);
        return { sortedOrders: driverOrders, nextOrder: next, completedOrders: completed, allOrdersDelivered: allDelivered };
    }
    const routeOrder = driver.route.map(loc => loc.address);
    const filteredAndSorted = [...driverOrders].sort((a, b) => {
      const indexA = routeOrder.indexOf(a.address);
      const indexB = routeOrder.indexOf(b.address);
      if (indexA > -1 && indexB > -1) return indexA - indexB;
      if (indexA > -1) return -1;
      if (indexB > -1) return 1;
      return 0;
    });
    const next = filteredAndSorted.find(o => o.status === OrderStatus.EnRoute);
    const completed = filteredAndSorted.filter(o => o.status === OrderStatus.Delivered);
    const allDelivered = filteredAndSorted.length > 0 && completed.length === filteredAndSorted.length;
    return { sortedOrders: filteredAndSorted, nextOrder: next, completedOrders: completed, allOrdersDelivered: allDelivered };
  }, [orders, driver.route, driver.id]);

  const mapUrl = useMemo(() => generateGoogleMapsUrl({ business: businessLocation, route: driver.route, driver: driver, completedStops: completedOrders.map(o => o.location!).filter(Boolean), }), [driver, businessLocation, completedOrders]);

  const handleStartRoute = () => {
      const firstOrder = sortedOrders.find(o => o.status === OrderStatus.Assigned);
      if(firstOrder) setOrders(prev => prev.map(o => o.id === firstOrder.id ? { ...o, status: OrderStatus.EnRoute } : o));
  }

  const proceedWithDelivery = (order: Order, imageUrl?: string) => {
    setOrders(prev => {
        const updatedOrders = prev.map(o =>
            o.id === order.id ? { ...o, status: OrderStatus.Delivered, deliveredAt: new Date().toISOString(), proofOfDeliveryImageUrl: imageUrl } : o
        );
        const nextOrderInRoute = sortedOrders.find(o => o.status === OrderStatus.Assigned);
        if(nextOrderInRoute) {
             return updatedOrders.map(o => o.id === nextOrderInRoute.id ? {...o, status: OrderStatus.EnRoute} : o);
        }
        return updatedOrders;
    });
    setOrderForProof(null); setProofImage(null);
  };

  const handleMarkDelivered = (order: Order) => {
    if (!order.location) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceFromLatLonInKm(latitude, longitude, order.location!.lat, order.location!.lng);
        if (distance > 0.5) { // 500 meters
          setDistanceWarning({ title: "Estás demasiado lejos", message: `Te encuentras a ${Math.round(distance * 1000)} metros. Debes estar a menos de 500 metros para confirmar la entrega.` });
          return;
        }
        setOrderForProof(order);
      },
      () => alert('No se pudo obtener la ubicación. Por favor, activa el GPS y concede los permisos.')
    );
  };

  const handleFinishShift = () => {
     navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceFromLatLonInKm(latitude, longitude, businessLocation.lat, businessLocation.lng);
        if (distance > 0.1) { // 100 meters
          setDistanceWarning({ title: "No estás en la base", message: `Debes volver a la base para finalizar el turno. Estás a ${Math.round(distance * 1000)} metros.` });
        } else {
          setDriver({ ...driver, route: [], routeConfirmed: false });
        }
      },
       () => alert('No se pudo obtener la ubicación. Por favor, activa el GPS y concede los permisos.')
    );
  };

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentReason || !showIncidentForm) return;
    const newIncident: Incident = { id: Date.now(), orderId: showIncidentForm, driverId: driver.id, type: IncidentType.Manual, reason: incidentReason, timestamp: new Date().toISOString(), location: driver.currentLocation || businessLocation };
    setIncidents(prev => [...prev, newIncident]);
    setShowIncidentForm(null); setIncidentReason('');
  };

  const handlePhotoTaken = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setProofImage(reader.result as string);
        };
        reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleConfirmWithProof = () => {
    if (orderForProof && proofImage) {
        const now = new Date();
        const createdAt = new Date(orderForProof.createdAt);
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        if (diffHours > 2) {
            setTimeWarning(orderForProof);
        } else {
            proceedWithDelivery(orderForProof, proofImage);
        }
    }
  };

  const handleOpenNotifications = () => {
    setNotificationsToShow(notifications); // Capture current unread notifications
    setShowNotifications(true);
    markNotificationsAsRead(); // Mark them as read in the parent state
  };
  
  const isRouteStarted = sortedOrders.some(o => o.status === OrderStatus.EnRoute);
  const hasAssignedOrders = sortedOrders.some(o => o.status === OrderStatus.Assigned);

  if (driver.status === DriverStatus.Inactive) {
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-center p-4">
            <WarningIcon className="w-16 h-16 text-yellow-400 mb-4" />
            <h1 className="text-2xl font-bold text-white">Tu cuenta está inactiva</h1>
            <p className="text-gray-400 mt-2">Contacta con un administrador para empezar a recibir rutas.</p>
             <button onClick={onLogout} className="mt-6 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                <LogoutIcon className="h-5 w-5" /> Cerrar Sesión
            </button>
        </div>
     )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="flex-shrink-0 bg-gray-800 p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-2xl font-bold text-white">{driver.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-3 h-3 rounded-full bg-green-400"></span><span className="text-sm text-gray-300">Activo</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={handleOpenNotifications} className="relative text-gray-300 hover:text-white">
                <BellIcon className="h-7 w-7" />
                {notifications.length > 0 && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-gray-800"></span>}
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                <LogoutIcon className="h-5 w-5" /> Cerrar Sesión
            </button>
        </div>
      </header>
      
      {distanceWarning && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDistanceWarning(null)}>
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
                <WarningIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">{distanceWarning.title}</h2>
                <p className="text-gray-300 mb-6">{distanceWarning.message}</p>
                <button onClick={() => setDistanceWarning(null)} className="w-full px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700">Entendido</button>
            </div>
        </div>
      )}

      {timeWarning && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setTimeWarning(null)}>
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
                <WarningIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Confirmación Requerida</h2>
                <p className="text-gray-300 mb-6">El tiempo de entrega es superior a 2 horas. ¿Qué deseas hacer?</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => { if (timeWarning) proceedWithDelivery(timeWarning, proofImage || undefined); setTimeWarning(null); }} className="w-full px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 font-semibold">Confirmar Entrega</button>
                    <button onClick={() => { if (timeWarning) setShowIncidentForm(timeWarning.id); setTimeWarning(null); }} className="w-full px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 font-semibold">Reportar Incidencia</button>
                    <button onClick={() => setTimeWarning(null)} className="w-full px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700">Cancelar</button>
                </div>
            </div>
        </div>
      )}

      {orderForProof && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4" onClick={() => { setOrderForProof(null); setProofImage(null); }}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Prueba de Entrega</h2>
            <p className="text-gray-400 text-center mb-4">Toma una foto del paquete en la puerta del cliente para confirmar la entrega.</p>
            <div className="w-full aspect-video bg-gray-700 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                {proofImage ? (<img src={proofImage} alt="Vista previa" className="w-full h-full object-cover" />) : (<CameraIcon className="w-16 h-16 text-gray-500" />)}
            </div>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoTaken} className="hidden" />
            <div className="w-full grid grid-cols-2 gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
                  <CameraIcon className="w-6 h-6" /> {proofImage ? 'Tomar Otra' : 'Abrir Cámara'}
              </button>
              <button onClick={handleConfirmWithProof} disabled={!proofImage} className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition disabled:bg-gray-600 disabled:cursor-not-allowed">Confirmar</button>
            </div>
             <button onClick={() => { setOrderForProof(null); setProofImage(null); }} className="mt-4 text-sm text-gray-400 hover:text-white">Cancelar</button>
          </div>
        </div>
      )}

       {showNotifications && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowNotifications(false)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Notificaciones</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notificationsToShow.length > 0 ? [...notificationsToShow].reverse().map(n => (
                <div key={n.id} className="p-3 bg-gray-700 rounded-lg">
                  <p className="text-white">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                </div>
              )) : <p className="text-gray-500">No tienes notificaciones nuevas.</p>}
            </div>
            <button onClick={() => setShowNotifications(false)} className="mt-4 w-full px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700">Cerrar</button>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 lg:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4 flex flex-col">
            <h2 className="text-xl font-semibold mb-3 text-cyan-400 flex items-center gap-2"><RouteIcon className="w-6 h-6" /> Mapa de Ruta</h2>
            <div className="flex-grow bg-gray-700 rounded-lg overflow-hidden relative"><img src={mapUrl} alt="Mapa de la ruta" className="w-full h-full object-cover" /></div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-4 flex flex-col">
            <h2 className="text-xl font-semibold mb-3 text-cyan-400 flex items-center gap-2"><PackageIcon className="w-6 h-6" /> Hoja de Ruta</h2>
            {sortedOrders.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-500 text-center">
                    <PackageIcon className="w-16 h-16 mb-4" /><p className="font-semibold">¡Listo para empezar!</p><p className="text-sm">Espera a que un administrador te asigne una ruta.</p>
                </div>
            ) : (
                <div className="flex-grow flex flex-col">
                    {!isRouteStarted && hasAssignedOrders && driver.routeConfirmed && (
                        <div className="mb-4">
                            <button onClick={handleStartRoute} className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-bold transition-transform transform hover:scale-105">
                                <PlayIcon className="w-6 h-6" /> Comenzar Ruta
                            </button>
                        </div>
                    )}
                    <div className="flex-grow space-y-3 overflow-y-auto pr-1">
                        <div className="p-3 rounded-lg bg-gray-700 flex items-center gap-3">
                            <BusinessIcon className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                            <div><p className="font-bold text-white">Punto de Partida</p><p className="text-sm text-gray-400">{businessLocation.address}</p></div>
                        </div>
                        {sortedOrders.map((order, index) => (
                            <div key={order.id} className={`p-3 rounded-lg shadow-md transition-all ${order.status === 'En Ruta' ? 'bg-cyan-800/80 ring-2 ring-cyan-500' : order.status === OrderStatus.Delivered ? 'bg-gray-700 opacity-50' : 'bg-gray-700'}`}>
                                <div className="flex items-start gap-4">
                                   <div className={`mt-1 flex-shrink-0 font-bold h-6 w-6 flex items-center justify-center rounded-full ${order.status === OrderStatus.Delivered ? 'bg-green-500 text-white' : 'bg-gray-600 text-cyan-300'}`}>
                                       {order.status === OrderStatus.Delivered ? <CheckCircleIcon className="w-5 h-5"/> : index + 1}
                                   </div>
                                   <div className="flex-grow">
                                        <p className={`font-bold text-white ${order.status === OrderStatus.Delivered ? 'line-through' : ''}`}>{order.name}</p>
                                        <p className="text-sm text-gray-400 mt-1">{order.address}</p>
                                   </div>
                                </div>
                                {order.status === OrderStatus.EnRoute && (
                                    <div className="mt-3 pt-3 border-t border-gray-600/50 grid grid-cols-3 gap-2">
                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${order.location?.lat},${order.location?.lng}`} target="_blank" rel="noopener noreferrer" className="col-span-1 text-center py-2 px-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold transition">Cómo Llegar</a>
                                        <button onClick={() => handleMarkDelivered(order)} className="col-span-1 py-2 px-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-semibold transition">Entregado</button>
                                        <button onClick={() => setShowIncidentForm(order.id)} className="col-span-1 py-2 px-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-semibold transition">Incidencia</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {allOrdersDelivered && (
                            <div className="p-3 rounded-lg bg-gray-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <BusinessIcon className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                                    <div><p className="font-bold text-white">Volver a la Base</p><p className="text-sm text-gray-400">{businessLocation.address}</p></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                     <a href={`https://www.google.com/maps/dir/?api=1&destination=${businessLocation.lat},${businessLocation.lng}`} target="_blank" rel="noopener noreferrer" className="col-span-1 text-center py-2 px-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold transition">Cómo Llegar</a>
                                     <button onClick={handleFinishShift} className="col-span-1 py-2 px-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-semibold transition">Finalizar Turno</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </main>
      {showIncidentForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowIncidentForm(null)}>
            <form onSubmit={handleReportIncident} className="bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4">Reportar Incidencia</h2>
                <textarea value={incidentReason} onChange={(e) => setIncidentReason(e.target.value)} placeholder="Describe el problema..." className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500" rows={4} required></textarea>
                <div className="flex justify-end gap-3 mt-4"><button type="button" onClick={() => setShowIncidentForm(null)} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700">Cancelar</button><button type="submit" className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700">Enviar Reporte</button></div>
            </form>
        </div>
      )}
    </div>
  );
};
export default DriverView;