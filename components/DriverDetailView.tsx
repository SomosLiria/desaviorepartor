import React, { useMemo, useState } from 'react';
import { Driver, Order, Incident, OrderStatus, Location } from '../types';
import { ChevronLeftIcon, BusinessIcon, PackageIcon } from './icons/Icons';

interface DriverDetailViewProps {
  driver: Driver;
  orders: Order[];
  incidents: Incident[];
  onBack: () => void;
  businessLocation: Location;
}

type Period = 'today' | 'week' | 'month';

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
    <div className="bg-gray-700 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{title}</p>
    </div>
);

const DriverDetailView: React.FC<DriverDetailViewProps> = ({ driver, orders, incidents, onBack, businessLocation }) => {
  const [period, setPeriod] = useState<Period>('today');
    
  const { filteredOrders, filteredIncidents, stats } = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case 'week':
            const todayForWeek = new Date(now);
            const dayOfWeek = todayForWeek.getDay(); // 0 (Sun) to 6 (Sat)
            const diff = todayForWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is Sunday
            const monday = new Date(todayForWeek.setDate(diff));
            startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'today':
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
    }
    
    const startTimeMs = startDate.getTime();

    const filteredOrders = orders.filter(o => 
        o.assignedTo === driver.id && 
        new Date(o.createdAt).getTime() >= startTimeMs
    );

    const deliveredInPeriod = filteredOrders.filter(o => o.status === OrderStatus.Delivered && o.deliveredAt);
    
    const filteredIncidents = incidents.filter(i => 
        i.driverId === driver.id &&
        new Date(i.timestamp).getTime() >= startTimeMs
    );

    // Common stats
    const deliveredCount = deliveredInPeriod.length;
    const kmTraveled = (deliveredCount * 5).toFixed(1);
    const deliveryTimes = deliveredInPeriod
        .map(o => (new Date(o.deliveredAt!).getTime() - new Date(o.createdAt).getTime()) / 60000)
        .filter(t => t > 0);
    const avgDeliveryTime = deliveryTimes.length > 0 ? (deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length).toFixed(1) : '0';

    let currentStats;

    if (period === 'today') {
        let startTime: Date | null = null;
        let endTime: Date | null = null;
        
        if (filteredOrders.length > 0) {
            startTime = filteredOrders.reduce((earliest, order) => {
                const orderDate = new Date(order.createdAt);
                return earliest < orderDate ? earliest : orderDate;
            }, new Date());
        }
        if (deliveredInPeriod.length > 0) {
            endTime = deliveredInPeriod.reduce((latest, order) => {
                const orderDate = new Date(order.deliveredAt!);
                return latest > orderDate ? latest : orderDate;
            }, new Date(0));
        }

        const totalTimeMinutes = startTime && endTime && endTime > startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : 0;
        const productivity = totalTimeMinutes > 0 ? (deliveredInPeriod.length / (totalTimeMinutes / 60)).toFixed(2) : 0;
        
        currentStats = {
            startTime: startTime ? startTime.toLocaleTimeString() : 'N/A',
            endTime: endTime ? endTime.toLocaleTimeString() : 'N/A',
            totalTime: `${totalTimeMinutes} min`,
            deliveredCount,
            kmTraveled: `${kmTraveled} km`,
            productivity,
        };
    } else {
        currentStats = {
            totalOrders: filteredOrders.length,
            deliveredCount,
            avgDeliveryTime: `${avgDeliveryTime} min`,
            kmTraveled: `${kmTraveled} km`,
            totalIncidents: filteredIncidents.length,
        };
    }
    
    return {
        filteredOrders,
        filteredIncidents,
        stats: currentStats,
    };
  }, [driver.id, orders, incidents, period]);
  
  const periodTitles = {
    today: {
      main: "Análisis de la jornada de hoy",
      map: "Ruta de Hoy",
      orders: "Desglose de Pedidos de Hoy",
      incidents: "Incidencias de Hoy",
      noData: "Sin pedidos hoy.",
      noIncidents: "Sin incidencias registradas hoy."
    },
    week: {
      main: "Análisis de esta semana",
      map: "Pedidos de la Semana",
      orders: "Desglose de Pedidos de la Semana",
      incidents: "Incidencias de la Semana",
      noData: "Sin pedidos esta semana.",
      noIncidents: "Sin incidencias registradas esta semana."
    },
    month: {
      main: "Análisis de este mes",
      map: "Pedidos del Mes",
      orders: "Desglose de Pedidos del Mes",
      incidents: "Incidencias del Mes",
      noData: "Sin pedidos este mes.",
      noIncidents: "Sin incidencias registradas este mes."
    },
  };

  const PeriodButton = ({ value, label }: { value: Period; label: string }) => (
    <button
      onClick={() => setPeriod(value)}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
        period === value
          ? 'bg-cyan-600 text-white'
          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
      }`}
    >
      {label}
    </button>
  );


  return (
    <div>
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold">
        <ChevronLeftIcon className="w-5 h-5" />
        Volver a Analíticas
      </button>
      <div className="bg-gray-800 p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1">{driver.name}</h1>
                <p className="text-lg font-semibold text-cyan-400">
                    {periodTitles[period].main}
                </p>
            </div>
            <div className="flex-shrink-0 flex gap-2">
                <PeriodButton value="today" label="Hoy" />
                <PeriodButton value="week" label="Semana" />
                <PeriodButton value="month" label="Mes" />
            </div>
        </div>
        
        {period === 'today' ? (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Hora de Salida" value={stats.startTime} />
            <StatCard title="Última Entrega" value={stats.endTime} />
            <StatCard title="Tiempo Total" value={stats.totalTime} />
            <StatCard title="Pedidos Entregados" value={stats.deliveredCount} />
            <StatCard title="Pedidos/Hora" value={`${stats.productivity}`} />
            <StatCard title="KM Recorridos (est.)" value={stats.kmTraveled} />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard title="Pedidos Totales" value={stats.totalOrders} />
              <StatCard title="Pedidos Entregados" value={stats.deliveredCount} />
              <StatCard title="Tiempo Medio Entrega" value={stats.avgDeliveryTime} />
              <StatCard title="KM Recorridos (est.)" value={stats.kmTraveled} />
              <StatCard title="Total Incidencias" value={stats.totalIncidents} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
          <div className="lg:col-span-3 bg-gray-800 p-4 rounded-xl">
             <h3 className="text-lg font-semibold text-cyan-400 mb-3">{periodTitles[period].map}</h3>
             <div className="h-96 bg-gray-700 rounded-lg relative overflow-hidden">
                <img 
                    src={`https://images.unsplash.com/photo-1563089201-419b16863678?q=80&w=1200&auto=format&fit=crop`} 
                    alt="Map of Algeciras" 
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-gray-500 text-lg font-semibold">(Simulación de Ruta)</p>
                </div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" title={businessLocation.address}>
                    <BusinessIcon className="w-10 h-10 text-cyan-400" />
                 </div>
                 {filteredOrders.map((order, index) => (
                    <div key={order.id} className="absolute" style={{top: `${15 + (index%5) * 18}%`, left: `${10 + Math.floor(index/5) * 20}%`}} title={order.address}>
                        <div className="relative">
                            <PackageIcon className={`w-8 h-8 ${order.status === OrderStatus.Delivered ? 'text-green-400' : 'text-yellow-400'}`} />
                            <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">{index + 1}</span>
                        </div>
                    </div>
                ))}
             </div>
          </div>
          <div className="lg:col-span-2 bg-gray-800 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">{periodTitles[period].orders}</h3>
              <div className="overflow-y-auto h-96 pr-2">
                 {filteredOrders.length > 0 ? (
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-gray-800">
                             <tr>
                                <th className="pb-2">Pedido</th>
                                <th className="pb-2">Estado</th>
                                <th className="pb-2">Tiempo</th>
                             </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(o => {
                                const time = o.deliveredAt ? `${Math.round((new Date(o.deliveredAt).getTime() - new Date(o.createdAt).getTime()) / 60000)} min` : '-';
                                return (
                                <tr key={o.id} className="border-t border-gray-700">
                                    <td className="py-2">{o.name}</td>
                                    <td><span className={`px-2 py-0.5 rounded-full text-xs ${o.status === OrderStatus.Delivered ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{o.status}</span></td>
                                    <td>{time}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                 ) : <p className="text-gray-500 text-center pt-16">{periodTitles[period].noData}</p>}
              </div>
          </div>
      </div>
       <div className="bg-gray-800 p-6 rounded-xl mt-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">{periodTitles[period].incidents}</h3>
            {filteredIncidents.length > 0 ? (
                <ul className="space-y-2">
                    {filteredIncidents.map(i => (
                        <li key={i.id} className="text-gray-300 border-l-2 border-red-500 pl-3">
                           <p className="font-medium text-white">{i.reason}</p>
                           <p className="text-xs text-gray-400">Pedido #{i.orderId} - {new Date(i.timestamp).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-gray-500">{periodTitles[period].noIncidents}</p>}
       </div>
    </div>
  );
};

export default DriverDetailView;