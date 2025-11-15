
import { GoogleGenAI } from "@google/genai";
import { Order, Driver, Incident } from '../types';

if (!process.env.API_KEY) {
  // En un entorno de producción, la clave vendrá de config.js, pero esta advertencia es útil para el desarrollo.
  const apiKey = typeof window !== 'undefined' && (window as any).APP_CONFIG ? (window as any).APP_CONFIG.API_KEY : null;
  if (!apiKey || apiKey === 'TU_API_KEY_DE_GOOGLE_AQUI') {
    console.warn("API_KEY not set for Gemini. Report generation will fail.");
  }
}

const getApiKey = () => {
    if (process.env.API_KEY) {
        return process.env.API_KEY;
    }
    // @ts-ignore
    if (window.APP_CONFIG && window.APP_CONFIG.API_KEY) {
        // @ts-ignore
        return window.APP_CONFIG.API_KEY;
    }
    return null;
}

const getAiInstance = () => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
}


export const generatePerformanceReportWithGemini = async (
    orders: Order[],
    drivers: Driver[],
    incidents: Incident[],
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly'
): Promise<string> => {
    
    const ai = getAiInstance();
    if (!ai) {
        return "Error: La clave de API para el servicio de IA no está configurada. No se puede generar el reporte.";
    }

    const periodLabels = {
        daily: 'Diario',
        weekly: 'Semanal',
        monthly: 'Mensual',
        quarterly: 'Trimestral',
    };
    const periodLabel = periodLabels[period];

    const prompt = `
      Generate a performance report for a delivery team in Algeciras for the selected period.
      The report should be in Spanish and formatted in Markdown.
      The report title should be "Reporte de Rendimiento ${periodLabel}".
      Analyze the provided data and summarize:
      1.  **Resumen General**: Total de pedidos, kilómetros recorridos (estimados), e incidencias en el período.
      2.  **Rendimiento Individual por Repartidor**: For each driver, list completed orders, estimated KMs, and number of incidents during the period. Only include drivers who had activity.
      3.  **Análisis de Eficiencia**: Calculate average delivery time for the period. Mention any drivers with notable performance (positive or negative).
      4.  **Análisis de Incidencias**: Summarize the types of incidents that occurred during the period.
      5.  **Ranking del Repartidor del Período**: Based on a combination of metrics (number of deliveries completed, low average delivery time, and zero or few incidents), create a ranked list of drivers for the period. Announce the "#1 Repartidor del Período" and briefly justify your choice based on the data.
      6.  **Conclusiones y Recomendaciones**: Provide brief, actionable recommendations based on the period's data.

      **Datos del Período (${periodLabel}):**
      - **Repartidores:** ${JSON.stringify(drivers.map(d => ({id: d.id, name: d.name})))}
      - **Pedidos Completados:** ${JSON.stringify(orders.filter(o => o.status === 'Entregado'))}
      - **Incidencias:** ${JSON.stringify(incidents)}

      Assume an average of 5km per delivery for calculations if not specified. For the ranking, give more weight to the number of deliveries and low delivery times. Penalize for incidents.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating report with Gemini:", error);
        return "Error al generar el reporte. Por favor, intente de nuevo.";
    }
};