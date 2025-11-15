import React, { useState, useMemo, useCallback, FC, useEffect } from 'react';
import { Order, Driver, Location, OrderStatus, Incident, DriverStatus, OrderPriority } from '../types';
import { geocodeAddress, optimizeRoute, AddressValidationResult } from '../services/googleMapsService';
import { PlusCircleIcon, SpinnerIcon, ExclamationCircleIcon, CheckCircleIcon, WarningIcon, LocationMarkerIcon, PencilIcon, TrashIcon, ImageIcon } from './icons/Icons';

interface OrderManagerProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  businessLocation: Location;
  incidents: Incident[];
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all';

interface OrderCardProps {
    order: Order;
    onSelect: (id: number) => void;
    isSelected: boolean;
    incidentReason?: string;
    driverName?: string;
    onPriorityChange?: (priority: OrderPriority) => void;
    hasTimeWarning?: boolean;
    onEdit?: (order: Order) => void;
    onDelete?: (orderId: number) => void;
    onViewImage?: (imageUrl: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onSelect, isSelected, driverName, onPriorityChange, hasTimeWarning, onEdit, onDelete, onViewImage }) => {
    const creationTime = new Date(order.createdAt).toLocaleTimeString('es-ES', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const priorityColors = {
        [OrderPriority.High]: 'border-l-4 border-red-500',
        [OrderPriority.Medium]: 'border-l-4 border-orange-500',
        [OrderPriority.Low]: 'border-l-4 border-yellow-500',
    };
    const priorityClass = order.priority ? priorityColors[order.priority] : 'border-l-4 border-gray-700';

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button, select')) {
            return;
        }
        onSelect(order.id);
    }

    return (
        <div className={`p-3 rounded-lg bg-gray-700 border-2 ${isSelected ? 'border-cyan-500' : 'border-transparent'} cursor-pointer transition-all duration-200 ${priorityClass}`} onClick={handleCardClick}>
            <div className="flex justify-between items-start">
                <p className="font-bold text-white flex items-center gap-2">
                    {order.name}
                    {hasTimeWarning && (
                        <span title="Este pedido lleva esperando más de 10 min. que otros en la selección. Considere darle prioridad alta.">
                            <WarningIcon className="w-5 h-5 text-yellow-400" />
                        </span>
                    )}
                </p>
                 {driverName ? (
                    <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">{driverName}</span>
                ) : onPriorityChange ? (
                    <select
                        value={order.priority || OrderPriority.Medium}
                        onChange={(e) => onPriorityChange(e.target.value as OrderPriority)}
                        className="bg-gray-600 border border-gray-500 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value={OrderPriority.High}>Alta</option>
                        <option value={OrderPriority.Medium}>Media</option>
                        <option value={OrderPriority.Low}>Baja</option>
                    </select>
                ) : null}
            </div>
            <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-400 truncate pr-2 min-w-0">{order.address}</p>
                <span className="text-xs font-semibold text-gray-500 ml-2 whitespace-nowrap">{creationTime}</span>
            </div>
            {order.status === OrderStatus.PendingAssignment && onEdit && onDelete && (
                 <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-600/50">
                    <button onClick={() => onEdit(order)} className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300"><PencilIcon className="w-4 h-4" /> Editar</button>
                    <button onClick={() => onDelete(order.id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /> Cancelar</button>
                </div>
            )}
            {order.status === OrderStatus.Delivered && order.proofOfDeliveryImageUrl && onViewImage && (
                <div className="mt-2 pt-2 border-t border-gray-600/50">
                    <button onClick={() => onViewImage(order.proofOfDeliveryImageUrl!)} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-semibold">
                        <ImageIcon className="w-5 h-5" /> Ver Prueba de Entrega
                    </button>
                </div>
            )}
        </div>
    );
};


const OrderManager: React.FC<OrderManagerProps> = ({ orders, setOrders, drivers, setDrivers, businessLocation }) => {
  const [showForm, setShowForm] = useState(false);
  const [newOrderName, setNewOrderName] = useState('');
  const [newOrderAddress, setNewOrderAddress] = useState('');
  const [newOrderNotes, setNewOrderNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [validatedLocation, setValidatedLocation] = useState<Location | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [imageViewUrl, setImageViewUrl] = useState<string | null>(null);


  useEffect(() => {
    if (editingOrder) {
        setNewOrderName(editingOrder.name);
        setNewOrderAddress(editingOrder.address);
        setNewOrderNotes(editingOrder.notes || '');
        setValidatedLocation(editingOrder.location || null);
        setShowForm(true);
    } else {
        setNewOrderName('');
        setNewOrderAddress('');
        setNewOrderNotes('');
        setValidatedLocation(null);
        setValidationResult(null);
    }
  }, [editingOrder]);

  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;
    const now = new Date();
    let startDate: Date;
    switch (period) {
        case 'week':
            const dayOfWeek = now.getDay(); const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startDate = new Date(new Date(now.setDate(diff)).setHours(0, 0, 0, 0));
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'today':
        default:
            startDate = new Date(new Date().setHours(0, 0, 0, 0));
            break;
    }
    return orders.filter(o => new Date(o.createdAt).getTime() >= startDate.getTime());
  }, [orders, period]);

  const timeWarningOrders = useMemo(() => {
    if (selectedOrders.length < 2) return new Set();
    const selected = orders.filter(o => selectedOrders.includes(o.id));
    if (selected.length < 2) return new Set();
    const creationTimestamps = selected.map(o => new Date(o.createdAt).getTime());
    const minTime = Math.min(...creationTimestamps);
    const maxTime = Math.max(...creationTimestamps);
    if ((maxTime - minTime) > 10 * 60 * 1000) { // 10 minutes
        const oldestOrder = selected.find(o => new Date(o.createdAt).getTime() === minTime);
        return oldestOrder ? new Set([oldestOrder.id]) : new Set();
    }
    return new Set();
  }, [selectedOrders, orders]);
  
  const handleVerifyAddress = async () => {
    if (!newOrderAddress) return;
    setIsVerifying(true); setValidationResult(null); setValidatedLocation(null);
    const result = await geocodeAddress(newOrderAddress);
    setValidationResult(result);
    if (result.isValid && result.lat && result.lng) {
        setValidatedLocation({ address: result.formattedAddress, lat: result.lat, lng: result.lng });
        setNewOrderAddress(result.formattedAddress);
    }
    setIsVerifying(false);
  };
  
  const resetForm = () => {
    setShowForm(false); setEditingOrder(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderName || !newOrderAddress || !validatedLocation) {
        setValidationResult({ isValid: false, formattedAddress: newOrderAddress, warning: 'Por favor, verifica la dirección antes de guardar.'});
        return;
    }

    if (editingOrder) {
        const updatedOrder: Order = {
            ...editingOrder,
            name: newOrderName,
            address: newOrderAddress,
            notes: newOrderNotes,
            location: validatedLocation,
        };
        setOrders(prev => prev.map(o => o.id === editingOrder.id ? updatedOrder : o));
    } else {
        const newOrder: Order = {
            id: Date.now(), name: newOrderName, address: newOrderAddress, notes: newOrderNotes,
            status: OrderStatus.PendingAssignment, location: validatedLocation,
            createdAt: new Date().toISOString(), priority: OrderPriority.Medium,
        };
        setOrders(prev => [newOrder, ...prev]);
    }
    resetForm();
  };
  
  const handleDeleteOrder = (orderId: number) => {
    if (window.confirm('¿Estás seguro de que quieres cancelar este pedido? Esta acción no se puede deshacer.')) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  const handleSelectOrder = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.status !== OrderStatus.PendingAssignment) { setSelectedOrders([]); return; }
    setSelectedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId] );
  };

  const handlePriorityChange = (orderId: number, priority: OrderPriority) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, priority } : o));
  };

  const handleAssignToDriver = async (driverId: number) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver || selectedOrders.length === 0) return;
    setIsAssigning(true);
    const updatedOrdersWithPriority = orders.map(o => selectedOrders.includes(o.id) ? { ...o, status: OrderStatus.Assigned, assignedTo: driverId } : o);
    const allDriverOrders = updatedOrdersWithPriority.filter(o => o.assignedTo === driverId && o.status === OrderStatus.Assigned);
    if (allDriverOrders.length > 0) {
        const optimizedRouteLocations = await optimizeRoute(businessLocation, allDriverOrders);
        if (optimizedRouteLocations) {
            setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, route: optimizedRouteLocations, routeConfirmed: true } : d));
            setOrders(updatedOrdersWithPriority);
        } else {
             alert("Error al optimizar la ruta. Asignando sin optimizar.");
             setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, route: allDriverOrders.map(o => o.location!), routeConfirmed: true } : d));
             setOrders(updatedOrdersWithPriority);
        }
    } else {
        setOrders(updatedOrdersWithPriority);
    }
    setSelectedOrders([]); setIsAssigning(false);
  };

  const renderColumn = (status: OrderStatus, title: string) => {
    const columnOrders = filteredOrders.filter(o => o.status === status).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return (
      <div className="bg-gray-800 rounded-xl p-4 flex flex-col flex-1 min-w-[320px]">
        <h2 className="font-bold text-lg mb-4 text-cyan-400 sticky top-0 bg-gray-800 py-2">{title} <span className="text-gray-400 font-normal text-sm">({columnOrders.length})</span></h2>
        <div className="space-y-3 overflow-y-auto pr-1 flex-grow">
          {columnOrders.map(order => (
            <OrderCard key={order.id} order={order} onSelect={handleSelectOrder} isSelected={selectedOrders.includes(order.id)}
              driverName={order.assignedTo ? drivers.find(d => d.id === order.assignedTo)?.name.split(' ')[0] : undefined}
              onPriorityChange={status === OrderStatus.PendingAssignment ? (p) => handlePriorityChange(order.id, p) : undefined}
              hasTimeWarning={timeWarningOrders.has(order.id)}
              onEdit={status === OrderStatus.PendingAssignment ? setEditingOrder : undefined}
              onDelete={status === OrderStatus.PendingAssignment ? handleDeleteOrder : undefined}
              onViewImage={status === OrderStatus.Delivered && order.proofOfDeliveryImageUrl ? setImageViewUrl : undefined}
            />
          ))}
        </div>
      </div>
    );
  };
  
  const PeriodButton = ({ value, label }: { value: PeriodFilter; label: string }) => (
    <button onClick={() => setPeriod(value)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition ${period === value ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}>{label}</button>
  );

  const availableDrivers = drivers.filter(d => d.status === DriverStatus.Active);
  
  return (
    <div className="h-full flex flex-col">
      {imageViewUrl && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setImageViewUrl(null)}>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <img src={imageViewUrl} alt="Prueba de entrega" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
                  <button onClick={() => setImageViewUrl(null)} className="absolute -top-4 -right-4 bg-gray-700 rounded-full p-1 text-white hover:bg-gray-600">&times;</button>
              </div>
          </div>
      )}
      <div className="flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-white">Gestión de Pedidos</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-700 p-1 rounded-lg">
                <PeriodButton value="today" label="Hoy" /> <PeriodButton value="week" label="Semana" />
                <PeriodButton value="month" label="Mes" /> <PeriodButton value="all" label="Ver Todo" />
            </div>
            <button onClick={() => { setShowForm(!showForm); if (showForm) setEditingOrder(null); }} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition">
              <PlusCircleIcon className="w-5 h-5" />
              {showForm ? 'Cerrar' : 'Nuevo Pedido'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleFormSubmit} className="bg-gray-800 p-6 rounded-xl mb-8 space-y-4">
            <h2 className="text-xl font-bold text-white">{editingOrder ? 'Editando Pedido' : 'Crear Nuevo Pedido'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="orderName" className="block text-sm font-medium text-gray-300 mb-1">Nombre/Referencia del Pedido</label>
                    <input id="orderName" type="text" placeholder="Ej: Pedido para Ana" value={newOrderName} onChange={e => setNewOrderName(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                    <label htmlFor="orderAddress" className="block text-sm font-medium text-gray-300 mb-1">Dirección de Entrega</label>
                    <div className="flex gap-2">
                        <input id="orderAddress" type="text" placeholder="Calle, Número, Ciudad" value={newOrderAddress} onChange={e => { setNewOrderAddress(e.target.value); setValidationResult(null); setValidatedLocation(null); }} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        <button type="button" onClick={handleVerifyAddress} disabled={isVerifying || !newOrderAddress} className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition">
                            {isVerifying ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Verificar'}
                        </button>
                    </div>
                    {validationResult && (
                        <div className={`mt-2 text-sm flex items-center gap-2 ${validationResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                            {validationResult.isValid ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationCircleIcon className="w-5 h-5" />}
                            <span>{validationResult.isValid ? 'Dirección válida.' : validationResult.warning}</span>
                        </div>
                    )}
                     {validatedLocation && (
                        <div className="mt-2 text-sm flex items-start gap-2 text-cyan-300 p-2 bg-cyan-900/50 rounded-md">
                            <LocationMarkerIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div><p><strong>Dirección formateada:</strong> {validatedLocation.address}</p><p><strong>Coords:</strong> {validatedLocation.lat.toFixed(4)}, {validatedLocation.lng.toFixed(4)}</p></div>
                        </div>
                    )}
                </div>
            </div>
            <div>
                 <label htmlFor="orderNotes" className="block text-sm font-medium text-gray-300 mb-1">Notas (opcional)</label>
                 <input id="orderNotes" type="text" placeholder="Ej: Dejar en conserjería" value={newOrderNotes} onChange={e => setNewOrderNotes(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div className="flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition">Cancelar</button>
                <button type="submit" disabled={!validatedLocation} className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition">
                    {editingOrder ? 'Guardar Cambios' : 'Guardar Pedido'}
                </button>
            </div>
          </form>
        )}
      </div>
      <div className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm p-3 rounded-xl mb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
            <p className="font-semibold text-white">{selectedOrders.length} pedido(s) seleccionado(s)</p>
            <div className="flex items-center gap-2">
                 <select disabled={selectedOrders.length === 0 || isAssigning || availableDrivers.length === 0} onChange={(e) => handleAssignToDriver(Number(e.target.value))} value="" className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-800 disabled:text-gray-500">
                    <option value="" disabled>{availableDrivers.length > 0 ? 'Asignar a...' : 'No hay repartidores'}</option>
                    {availableDrivers.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
                {isAssigning && <SpinnerIcon className="w-6 h-6 animate-spin text-cyan-400" />}
            </div>
        </div>
      </div>
      <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
        {renderColumn(OrderStatus.PendingAssignment, 'Pendiente de Asignar')}
        {renderColumn(OrderStatus.Assigned, 'Asignado')}
        {renderColumn(OrderStatus.EnRoute, 'En Ruta')}
        {renderColumn(OrderStatus.Delivered, 'Entregado')}
      </div>
    </div>
  );
};

export default OrderManager;