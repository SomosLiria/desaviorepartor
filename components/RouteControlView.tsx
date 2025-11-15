import React, { useState, useMemo, FC } from 'react';
import { Driver, Order, Location, OrderStatus, OrderPriority, DriverStatus } from '../types';
import { optimizeRoute } from '../services/googleMapsService';
import { getDistanceFromLatLonInKm } from '../utils';
import { RouteIcon, DriverIcon, SpinnerIcon, ArrowUpIcon, ArrowDownIcon, CheckBadgeIcon } from './icons/Icons';

interface RouteControlViewProps {
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  businessLocation: Location;
}

interface DriverRouteEditorProps {
    driver: Driver;
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
    businessLocation: Location;
}

const DriverRouteEditor: FC<DriverRouteEditorProps> = ({ driver, orders, setOrders, setDrivers, businessLocation }) => {
    const driverOrders = useMemo(() => orders.filter(o => o.assignedTo === driver.id && o.status === OrderStatus.Assigned), [orders, driver.id]);
    const [currentOrderList, setCurrentOrderList] = useState<Order[]>(driverOrders);
    const [isOptimizing, setIsOptimizing] = useState(false);

    const handlePriorityChange = (orderId: number, priority: OrderPriority) => {
        setCurrentOrderList(prev => prev.map(o => o.id === orderId ? { ...o, priority } : o));
    };

    const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === currentOrderList.length - 1) return;

        const newList = [...currentOrderList];
        const item = newList[index];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        newList[index] = newList[swapIndex];
        newList[swapIndex] = item;
        setCurrentOrderList(newList);
    };

    const handleOptimize = async () => {
        setIsOptimizing(true);
        const optimizedRouteLocations = await optimizeRoute(businessLocation, currentOrderList);
        if (optimizedRouteLocations) {
            const sortedOrders = optimizedRouteLocations.map(loc => currentOrderList.find(o => o.address === loc.address)!);
            setCurrentOrderList(sortedOrders);
        } else {
            alert("Error al optimizar la ruta.");
        }
        setIsOptimizing(false);
    };

    const handleConfirm = () => {
        const finalRouteLocations = currentOrderList.map(o => o.location!);
        setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, route: finalRouteLocations, routeConfirmed: true } : d));
        setOrders(prev => prev.map(order => {
            const updatedOrder = currentOrderList.find(o => o.id === order.id);
            if (updatedOrder) {
                return updatedOrder; // This includes the updated priority
            }
            return order;
        }));
    };

    const PriorityBadge = ({ priority }: { priority?: OrderPriority }) => {
        const colors = {
            [OrderPriority.High]: 'bg-red-500/20 text-red-300',
            [OrderPriority.Medium]: 'bg-orange-500/20 text-orange-300',
            [OrderPriority.Low]: 'bg-yellow-500/20 text-yellow-300',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority || OrderPriority.Medium]}`}>{priority}</span>;
    };


    return (
        <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <DriverIcon className="w-6 h-6"/> {driver.name} <span className="text-gray-400 font-normal text-sm">({currentOrderList.length} pedidos)</span>
            </h3>
            <div className="space-y-2">
                {currentOrderList.map((order, index) => (
                    <div key={order.id} className="bg-gray-700 p-3 rounded-lg flex items-center gap-3">
                        <div className="font-bold text-cyan-400 text-lg">{index + 1}</div>
                        <div className="flex-grow">
                            <p className="font-semibold text-white">{order.name}</p>
                            <p className="text-xs text-gray-400">{order.address}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit' })} | 
                                Distancia: {getDistanceFromLatLonInKm(businessLocation.lat, businessLocation.lng, order.location!.lat, order.location!.lng).toFixed(1)} km
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                             <select value={order.priority || OrderPriority.Medium} onChange={(e) => handlePriorityChange(order.id, e.target.value as OrderPriority)} className="bg-gray-600 border border-gray-500 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500">
                                <option value={OrderPriority.High}>Alta</option>
                                <option value={OrderPriority.Medium}>Media</option>
                                <option value={OrderPriority.Low}>Baja</option>
                            </select>
                            <div className="flex flex-col">
                                <button onClick={() => handleMoveOrder(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-white disabled:text-gray-600"><ArrowUpIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleMoveOrder(index, 'down')} disabled={index === currentOrderList.length - 1} className="p-1 text-gray-400 hover:text-white disabled:text-gray-600"><ArrowDownIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
                <button onClick={handleOptimize} disabled={isOptimizing} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800 transition">
                    {isOptimizing ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <RouteIcon className="w-5 h-5" />}
                    Optimizar con IA
                </button>
                <button onClick={handleConfirm} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                     <CheckBadgeIcon className="w-5 h-5" />
                    Confirmar y Enviar Ruta
                </button>
            </div>
        </div>
    )
}

const RouteControlView: React.FC<RouteControlViewProps> = (props) => {
    const driversToManage = useMemo(() => {
        return props.drivers.filter(d => 
            d.status === DriverStatus.Active && 
            !d.routeConfirmed &&
            props.orders.some(o => o.assignedTo === d.id && o.status === OrderStatus.Assigned)
        );
    }, [props.drivers, props.orders]);

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-6">Control de Rutas</h1>
            {driversToManage.length > 0 ? (
                 <div className="space-y-6 overflow-y-auto">
                    {driversToManage.map(driver => (
                        <DriverRouteEditor key={driver.id} driver={driver} {...props} />
                    ))}
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-500 bg-gray-800 rounded-xl">
                    <CheckBadgeIcon className="w-24 h-24 mb-4 text-green-500" />
                    <p className="text-lg font-semibold">Todo en orden.</p>
                    <p>No hay rutas pendientes de confirmación.</p>
                </div>
            )}
        </div>
    );
};

export default RouteControlView;