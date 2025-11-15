import React, { useState, useRef, useEffect } from 'react';
import { UserRole, Driver } from '../types';
import { LogoIcon, KeyIcon } from './icons/Icons';

interface LoginScreenProps {
  onLogin: (role: UserRole, name: string) => void;
  drivers: Driver[];
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, drivers }) => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (selectedDriver) {
      inputRefs.current[0]?.focus();
    }
  }, [selectedDriver]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple hardcoded password
      onLogin(UserRole.Admin, 'Administrador');
    } else {
      setError('Contraseña incorrecta.');
      setPassword('');
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // Only allow single digits

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit on 4th digit
    if (newPin.every(digit => digit !== '') && index === 3) {
      validatePin(newPin.join(''));
    }
  };

  const handleBackspace = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const validatePin = (enteredPin: string) => {
    if (selectedDriver?.pin === enteredPin) {
      onLogin(UserRole.Repartidor, selectedDriver.name);
    } else {
      setError('PIN incorrecto. Inténtalo de nuevo.');
      setTimeout(() => {
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }, 500);
    }
  }

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver);
    setError('');
    setPin(['', '', '', '']);
  }
  
  const handleGoBack = () => {
    setSelectedDriver(null);
    setError('');
  }

  if (selectedDriver) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 rounded-2xl shadow-lg text-center">
            <div className="flex flex-col items-center">
                <KeyIcon className="w-16 h-16 text-cyan-400 mb-4" />
                <h1 className="text-2xl font-bold text-white">Hola, {selectedDriver.name.split(' ')[0]}</h1>
                <p className="text-gray-400">Introduce tu PIN de 4 dígitos</p>
            </div>
            <div className="flex justify-center gap-3 my-4">
                {pin.map((digit, index) => (
                    <input
                        key={index}
                        ref={el => inputRefs.current[index] = el}
                        type="password"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        onKeyDown={(e) => handleBackspace(index, e)}
                        className="w-14 h-16 bg-gray-700 border-2 border-gray-600 rounded-lg text-center text-3xl font-bold text-white focus:outline-none focus:border-cyan-500 transition"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                    />
                ))}
            </div>
            {error && <p className="text-sm text-red-400 text-center -mt-2">{error}</p>}
             <div className="text-center mt-6">
                 <button onClick={handleGoBack} className="font-medium text-sm text-cyan-400 hover:text-cyan-300">
                    Volver a la selección
                </button>
             </div>
        </div>
      </div>
    )
  }

  if (showAdminLogin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-lg">
          <div className="flex flex-col items-center">
            <LogoIcon className="w-20 h-20 text-cyan-400" />
            <h1 className="mt-4 text-3xl font-bold text-center text-white">
              Acceso de Administrador
            </h1>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Ingresar
              </button>
            </div>
          </form>
          <div className="text-center">
             <button
                onClick={() => {
                  setShowAdminLogin(false);
                  setError('');
                  setPassword('');
                }}
                className="font-medium text-sm text-cyan-400 hover:text-cyan-300"
            >
                Volver a la selección de rol
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center">
            <LogoIcon className="w-20 h-20 text-cyan-400" />
          <h1 className="mt-4 text-3xl font-bold text-center text-white">
            ParDesavio Reparto Control PRO
          </h1>
          <p className="mt-2 text-center text-gray-400">Seleccione su rol para continuar</p>
        </div>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setShowAdminLogin(true)}
            className="w-full px-4 py-3 text-lg font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-transform transform hover:scale-105"
          >
            Acceder como Administrador
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">o acceder como repartidor</span>
            </div>
          </div>
          {drivers.map(driver => (
             <button
                key={driver.id}
                onClick={() => handleDriverSelect(driver)}
                className="w-full px-4 py-3 text-lg font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-transform transform hover:scale-105"
            >
                {driver.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
