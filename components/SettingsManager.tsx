
import React, { useState, useCallback, useEffect } from 'react';
import { Location } from '../types';
import { geocodeAddress, AddressValidationResult } from '../services/googleMapsService';
import { LocationMarkerIcon, SpinnerIcon, CheckCircleIcon, ExclamationCircleIcon, BusinessIcon } from './icons/Icons';

interface SettingsManagerProps {
  businessLocation: Location;
  setBusinessLocation: (location: Location) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ businessLocation, setBusinessLocation }) => {
  const [addressInput, setAddressInput] = useState(businessLocation.address);
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setAddressInput(businessLocation.address);
  }, [businessLocation]);
  
  const handleVerifyAndSave = useCallback(async () => {
    if (!addressInput) return;
    setIsVerifying(true);
    setIsSaved(false);
    setValidationResult(null);
    const result = await geocodeAddress(addressInput);
    setValidationResult(result);

    if (result.isValid && result.lat && result.lng) {
      setBusinessLocation({
        address: result.formattedAddress,
        lat: result.lat,
        lng: result.lng,
      });
      setAddressInput(result.formattedAddress);
      setIsSaved(true);
    }
    setIsVerifying(false);
  }, [addressInput, setBusinessLocation]);

  return (
    <div>
        <h1 className="text-3xl font-bold text-white mb-6">Configuración del Negocio</h1>
        <div className="bg-gray-800 p-6 rounded-xl space-y-4 max-w-2xl">
            <h2 className="text-xl font-semibold text-cyan-400 flex items-center gap-3">
                <BusinessIcon className="w-6 h-6" />
                Dirección Base del Negocio
            </h2>
            <p className="text-gray-400">
                Esta es la dirección de partida y retorno para todos los repartos. Es crucial para el seguimiento y los cálculos de rutas.
            </p>
            <div>
                <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-300 mb-1">
                    Dirección del negocio
                </label>
                <div className="flex gap-2">
                    <input 
                        id="businessAddress"
                        type="text" 
                        value={addressInput} 
                        onChange={e => {
                            setAddressInput(e.target.value);
                            setIsSaved(false);
                            setValidationResult(null);
                        }} 
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                    />
                    <button 
                        type="button" 
                        onClick={handleVerifyAndSave} 
                        disabled={isVerifying || !addressInput || addressInput === businessLocation.address} 
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
                    >
                        {isVerifying ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <LocationMarkerIcon className="w-5 h-5"/>}
                        {isVerifying ? 'Verificando...' : 'Verificar y Guardar'}
                    </button>
                </div>
            </div>
             {validationResult && (
                <div className={`mt-2 text-sm flex items-center gap-2 ${validationResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                    {validationResult.isValid ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationCircleIcon className="w-5 h-5" />}
                    <span>{validationResult.isValid ? `Dirección Válida: ${validationResult.formattedAddress}` : validationResult.warning}</span>
                </div>
            )}
            {isSaved && (
                 <div className="mt-2 text-sm flex items-center gap-2 text-green-400">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>¡La nueva dirección ha sido guardada con éxito!</span>
                </div>
            )}
        </div>
    </div>
  );
};

export default SettingsManager;