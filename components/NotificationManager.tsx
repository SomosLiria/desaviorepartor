import React, { useState } from 'react';
import { AppNotification } from '../types';
import { BellIcon, PaperAirplaneIcon } from './icons/Icons';

interface NotificationManagerProps {
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ notifications, setNotifications }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newNotification: AppNotification = {
      id: Date.now(),
      message: newMessage,
      timestamp: new Date().toISOString(),
      readBy: [],
    };

    setNotifications(prev => [newNotification, ...prev]);
    setNewMessage('');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Gestión de Notificaciones</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Send Notification Form */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-3">
            <PaperAirplaneIcon className="w-6 h-6" />
            Enviar Nueva Notificación
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            El mensaje se enviará a todos los repartidores que estén actualmente activos.
          </p>
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label htmlFor="notificationMessage" className="block text-sm font-medium text-gray-300 mb-1">
                Mensaje
              </label>
              <textarea
                id="notificationMessage"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                Enviar
              </button>
            </div>
          </form>
        </div>

        {/* Notification History */}
        <div className="bg-gray-800 p-6 rounded-xl flex flex-col">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-3">
            <BellIcon className="w-6 h-6" />
            Historial de Notificaciones
          </h2>
          <div className="flex-grow space-y-3 overflow-y-auto pr-2 max-h-96">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div key={notification.id} className="p-3 bg-gray-700 rounded-lg">
                  <p className="text-white">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.timestamp).toLocaleString('es-ES')}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <BellIcon className="w-16 h-16" />
                <p>No se han enviado notificaciones.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;
