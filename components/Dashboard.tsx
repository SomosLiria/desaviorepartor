import React, { useState } from 'react';
import { Driver, Order, Incident, Location, DriverStatus, AppNotification } from '../types';
import { LogoIcon, LogoutIcon, MapIcon, ClipboardListIcon, DriverIcon, DocumentReportIcon, AnalyticsIcon, CogIcon, BellIcon } from './icons/Icons';

import MapView from './MapView';
import OrderManager from './OrderManager';
import DriverManager from './DriverManager';
import ReportGenerator from './ReportGenerator';
import AnalyticsView from './AnalyticsView';
import SettingsManager from './SettingsManager';
import NotificationManager from './NotificationManager';


interface DashboardProps {
    userName: string;
    onLogout: () => void;
    drivers: Driver[];
    setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    incidents: Incident[];
    setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
    businessLocation: Location;
    setBusinessLocation: (location: Location) => void;
    notifications: AppNotification[];
    setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
}

type View = 'map' | 'orders' | 'drivers' | 'reports' | 'analytics' | 'settings' | 'notifications';

const Dashboard: React.FC<DashboardProps> = (props) => {
    const [currentView, setCurrentView] = useState<View>('analytics');

    const renderView = () => {
        switch (currentView) {
            case 'map':
                return <MapView drivers={props.drivers.filter(d => d.status === DriverStatus.Active)} orders={props.orders} businessLocation={props.businessLocation} />;
            case 'orders':
                return <OrderManager orders={props.orders} setOrders={props.setOrders} drivers={props.drivers} setDrivers={props.setDrivers} businessLocation={props.businessLocation} incidents={props.incidents} />;
            case 'drivers':
                return <DriverManager drivers={props.drivers} setDrivers={props.setDrivers} />;
            case 'reports':
                return <ReportGenerator orders={props.orders} drivers={props.drivers} incidents={props.incidents} />;
            case 'settings':
                return <SettingsManager businessLocation={props.businessLocation} setBusinessLocation={props.setBusinessLocation} />;
            case 'notifications':
                return <NotificationManager notifications={props.notifications} setNotifications={props.setNotifications} />;
            case 'analytics':
            default:
                return <AnalyticsView orders={props.orders} drivers={props.drivers} incidents={props.incidents} businessLocation={props.businessLocation} />;
        }
    };

    const NavItem = ({ view, label, icon: Icon }: { view: View, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 rounded-lg ${currentView === view ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
        >
            <Icon className="w-6 h-6 mr-3" />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            <aside className="w-64 flex-shrink-0 bg-gray-800 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center mb-8">
                        <LogoIcon className="w-10 h-10 text-cyan-400" />
                        <span className="ml-3 text-xl font-bold">Admin Panel</span>
                    </div>
                    <nav className="space-y-2">
                        <NavItem view="analytics" label="Analíticas" icon={AnalyticsIcon} />
                        <NavItem view="map" label="Mapa en Vivo" icon={MapIcon} />
                        <NavItem view="orders" label="Pedidos" icon={ClipboardListIcon} />
                        <NavItem view="drivers" label="Repartidores" icon={DriverIcon} />
                        <NavItem view="reports" label="Reportes" icon={DocumentReportIcon} />
                        <NavItem view="notifications" label="Notificaciones" icon={BellIcon} />
                    </nav>
                </div>
                <div className="border-t border-gray-700 pt-4">
                     <NavItem view="settings" label="Configuración" icon={CogIcon} />
                     <div className="flex items-center my-4">
                        <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center font-bold text-gray-900">{props.userName.charAt(0)}</div>
                        <span className="ml-3 font-semibold">{props.userName}</span>
                    </div>
                    <button onClick={props.onLogout} className="flex items-center w-full px-4 py-3 text-left text-red-400 hover:bg-gray-700 rounded-lg">
                        <LogoutIcon className="w-6 h-6 mr-3" />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
};

export default Dashboard;