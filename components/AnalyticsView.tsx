import React, { useState, useMemo } from 'react';
import { Order, Driver, Incident, OrderStatus, Location } from '../types';
import { ClipboardListIcon, DriverIcon, ExclamationCircleIcon, CheckCircleIcon } from './icons/Icons';
import DriverDetailView from './DriverDetailView';

interface AnalyticsViewProps {
  orders: Order[];
  drivers: Driver[];
  incidents: Incident[];
  businessLocation: Location;
}

const AnalyticsCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string }) => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    </div>
);


const AnalyticsView: React.FC<AnalyticsViewProps> = ({ orders, drivers, incidents, businessLocation }) => {
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const stats = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === OrderStatus.Delivered && o.deliveredAt && o.createdAt);
        const totalOrders = orders.length;
        const totalDrivers = drivers.length;
        const activeDrivers = drivers.filter(d => d.status === 'active').length;
        const totalIncidents = incidents.length;
        
        const deliveryTimes = deliveredOrders.map(o => (new Date(o.deliveredAt!).getTime() - new Date(o.createdAt).getTime()) / 60000);
        const avgDeliveryTime = deliveryTimes.length > 0 ? (deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length).toFixed(1) : 'N/A';
        
        return {
            totalOrders,
            deliveredOrders: deliveredOrders.length,
            pendingOrders: orders.filter(o => o.status === OrderStatus.PendingAssignment || o.status === OrderStatus.Assigned || o.status === OrderStatus.EnRoute).length,
            totalDrivers,
            activeDrivers,
            totalIncidents,
            avgDeliveryTime,
        }
    }, [orders, drivers, incidents]);

    const driverPerformance = useMemo(() => {
        return drivers.map(driver => {
            const driverOrders = orders.filter(o => o.assignedTo === driver.id);
            const delivered = driverOrders.filter(o => o.status === OrderStatus.Delivered);
            const driverIncidents = incidents.filter(i => i.driverId === driver.id);

            const deliveryTimes = delivered
                .filter(o => o.deliveredAt)
                .map(o => (new Date(o.deliveredAt!).getTime() - new Date(o.createdAt).getTime()) / 60000)
                .filter(t => t > 0);

            const avgTime = deliveryTimes.length > 0 ? (deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length).toFixed(1) : 'N/A';

            return {
                ...driver,
                totalOrders: driverOrders.length,
                deliveredOrders: delivered.length,
                totalIncidents: driverIncidents.length,
                avgDeliveryTime: avgTime,
            };
        });
    }, [orders, drivers, incidents]);

    if (selectedDriver) {
        return <DriverDetailView
            driver={selectedDriver}
            orders={orders}
            incidents={incidents}
            onBack={() => setSelectedDriver(null)}
            businessLocation={businessLocation}
        />
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Analíticas de Rendimiento</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <AnalyticsCard title="Total Pedidos" value={stats.totalOrders} icon={ClipboardListIcon} color="bg-cyan-500" />
                <AnalyticsCard title="Pedidos Entregados" value={stats.deliveredOrders} icon={CheckCircleIcon} color="bg-green-500" />
                <AnalyticsCard title="Repartidores Activos" value={`${stats.activeDrivers} / ${stats.totalDrivers}`} icon={DriverIcon} color="bg-blue-500" />
                <AnalyticsCard title="Total Incidencias" value={stats.totalIncidents} icon={ExclamationCircleIcon} color="bg-red-500" />
            </div>

            <div className="bg-gray-800 p-6 rounded-xl mt-8">
                <h2 className="text-xl font-semibold text-cyan-400 mb-4">Rendimiento de Repartidores</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="p-4 font-semibold">Repartidor</th>
                                <th className="p-4 font-semibold text-center">Pedidos Totales</th>
                                <th className="p-4 font-semibold text-center">Pedidos Entregados</th>
                                <th className="p-4 font-semibold text-center">Tiempo Medio (min)</th>
                                <th className="p-4 font-semibold text-center">Incidencias</th>
                            </tr>
                        </thead>
                        <tbody>
                            {driverPerformance.map(driver => (
                                <tr key={driver.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                    <td className="p-4">
                                        <button onClick={() => setSelectedDriver(driver)} className="font-semibold text-cyan-400 hover:underline">
                                            {driver.name}
                                        </button>
                                    </td>
                                    <td className="p-4 text-center">{driver.totalOrders}</td>
                                    <td className="p-4 text-center">{driver.deliveredOrders}</td>
                                    <td className="p-4 text-center">{driver.avgDeliveryTime}</td>
                                    <td className="p-4 text-center">{driver.totalIncidents}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;