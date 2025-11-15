import React, { useState } from 'react';
import { Driver, DriverStatus } from '../types';
import { UserAddIcon, ClipboardIcon, CheckCircleIcon } from './icons/Icons';

interface DriverManagerProps {
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
}

const DriverManager: React.FC<DriverManagerProps> = ({ drivers, setDrivers }) => {
  const [newDriverName, setNewDriverName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [copiedPin, setCopiedPin] = useState<number | null>(null);

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName) return;

    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    const newDriver: Driver = {
      id: Date.now(),
      name: newDriverName,
      status: DriverStatus.Inactive,
      pin: pin,
    };
    setDrivers(prev => [newDriver, ...prev]);
    setNewDriverName('');
    setShowForm(false);
  };

  const toggleDriverStatus = (id: number) => {
    setDrivers(drivers.map(driver => 
      driver.id === id 
        ? { ...driver, status: driver.status === DriverStatus.Active ? DriverStatus.Inactive : DriverStatus.Active }
        : driver
    ));
  };
  
  const copyPin = (pin: string, driverId: number) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(driverId);
    setTimeout(() => setCopiedPin(null), 2000);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Gestión de Repartidores</h1>
         <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition">
          <UserAddIcon className="w-5 h-5" />
          {showForm ? 'Cerrar' : 'Añadir Repartidor'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddDriver} className="bg-gray-800 p-6 rounded-xl mb-8 flex gap-4">
          <input 
            type="text" 
            placeholder="Nombre del nuevo repartidor" 
            value={newDriverName} 
            onChange={e => setNewDriverName(e.target.value)} 
            className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button type="submit" className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
            Guardar
          </button>
        </form>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-4 font-semibold">Nombre</th>
              <th className="p-4 font-semibold">PIN</th>
              <th className="p-4 font-semibold">Estado</th>
              <th className="p-4 font-semibold text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => (
              <tr key={driver.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                <td className="p-4">{driver.name}</td>
                <td className="p-4">
                    <div className="flex items-center gap-2 font-mono">
                        <span>{driver.pin || 'N/A'}</span>
                        {driver.pin && (
                             <button 
                                onClick={() => copyPin(driver.pin!, driver.id)} 
                                className="text-gray-400 hover:text-white transition"
                                title="Copiar PIN"
                            >
                                {copiedPin === driver.id ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${driver.status === DriverStatus.Active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {driver.status === DriverStatus.Active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => toggleDriverStatus(driver.id)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm">
                    {driver.status === DriverStatus.Active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriverManager;
