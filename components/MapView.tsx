import React from 'react';
import { Driver, Order, Location, OrderStatus } from '../types';
import { generateGoogleMapsUrl } from '../utils';
import { DriverIcon, PackageIcon } from './icons/Icons';

interface MapViewProps {
  drivers: Driver[];
  orders: Order[];
  businessLocation: Location;
}

const MapView: React.FC<MapViewProps> = ({ drivers, orders, businessLocation }) => {
  const activeOrders = orders.filter(o => o.location && o.status !== OrderStatus.Delivered);
  const activeDrivers = drivers.filter(d => d.currentLocation);

  const mapUrl = generateGoogleMapsUrl({
      center: businessLocation,
      business: businessLocation,
      drivers: activeDrivers,
      orders: activeOrders,
  });

  return (
    <div className="h-full flex flex-col">
        <h1 className="text-3xl font-bold text-white mb-6">Mapa en Vivo</h1>
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-800 p-4 rounded-xl">
                <div className="h-[75vh] md:h-full bg-gray-700 rounded-lg relative overflow-hidden">
                    <img 
                        src={mapUrl}
                        alt="Mapa en vivo de las rutas" 
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
            <div className="lg:col-span-1 bg-gray-800 p-4 rounded-xl flex flex-col">
                <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex-shrink-0">Leyenda</h2>
                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    <div>
                        <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                            <DriverIcon className="w-5 h-5" />
                            Repartidores ({activeDrivers.length})
                        </h3>
                        <div className="space-y-2">
                            {activeDrivers.length > 0 ? activeDrivers.map(driver => (
                                <div key={driver.id} className="flex items-center gap-3 p-2 bg-gray-700 rounded-lg">
                                    <span className="flex items-center justify-center w-6 h-6 bg-white text-gray-900 font-bold rounded-full text-sm flex-shrink-0">{driver.name.charAt(0)}</span>
                                    <span className="font-medium text-gray-200 truncate">{driver.name}</span>
                                </div>
                            )) : <p className="text-gray-500 text-sm">No hay repartidores activos con ubicación.</p>}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                            <PackageIcon className="w-5 h-5" />
                            Pedidos Activos ({activeOrders.length})
                        </h3>
                        <div className="space-y-2">
                            {activeOrders.length > 0 ? activeOrders.map((order, index) => (
                                <div key={order.id} className="flex items-start gap-3 p-2 bg-gray-700 rounded-lg">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-yellow-400 text-gray-900 font-bold rounded-full text-sm mt-1">{index + 1}</span>
                                    <div>
                                        <p className="font-medium text-gray-200">{order.name}</p>
                                        <p className="text-xs text-gray-400">{order.address}</p>
                                    </div>
                                </div>
                            )) : <p className="text-gray-500 text-sm">No hay pedidos activos para mostrar.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MapView;