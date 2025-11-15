
export const getGoogleApiKey = (): string | null => {
  // Para el entorno de desarrollo (como AI Studio) que inyecta la clave
  if (process.env.API_KEY) {
    return process.env.API_KEY;
  }

  // Para el despliegue en producción, lee desde el objeto global definido en config.js
  // @ts-ignore
  if (window.APP_CONFIG && window.APP_CONFIG.API_KEY && window.APP_CONFIG.API_KEY !== 'TU_API_KEY_DE_GOOGLE_AQUI') {
    // @ts-ignore
    return window.APP_CONFIG.API_KEY;
  }

  // Retorna null si no se encuentra la clave en ningún lado
  return null;
};
