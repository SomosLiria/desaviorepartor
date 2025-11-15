
import React, { useState, useCallback } from 'react';
import { Order, Driver, Incident } from '../types';
import { generatePerformanceReportWithGemini } from '../services/geminiService';
import { DocumentReportIcon, SpinnerIcon } from './icons/Icons';

interface ReportGeneratorProps {
  orders: Order[];
  drivers: Driver[];
  incidents: Incident[];
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

// Simple Markdown renderer
const MarkdownRenderer = ({ content }: { content: string }) => {
    const htmlContent = content
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-2 text-cyan-400">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3 border-b border-gray-600 pb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gim, '<li class="ml-6 list-disc">$1</li>')
        .replace(/\n/g, '<br />');

    return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent.replace(/<br \/>(\s*<li)/g, '$1') }} />;
};


const ReportGenerator: React.FC<ReportGeneratorProps> = ({ orders, drivers, incidents }) => {
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState<ReportPeriod>('weekly');

  const handleGenerateReport = useCallback(async () => {
    setIsLoading(true);
    setReport('');

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
    }

    const filteredOrders = orders.filter(o => new Date(o.createdAt) >= startDate);
    const filteredIncidents = incidents.filter(i => new Date(i.timestamp) >= startDate);

    const generatedReport = await generatePerformanceReportWithGemini(filteredOrders, drivers, filteredIncidents, period);
    setReport(generatedReport);
    setIsLoading(false);
  }, [orders, drivers, incidents, period]);

  const periodLabels: Record<ReportPeriod, string> = {
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
  };

  const PeriodButton = ({ value, label }: { value: ReportPeriod; label: string }) => (
    <button
        onClick={() => setPeriod(value)}
        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition ${period === value ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
    >
        {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-white">Reportes de Rendimiento</h1>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-700 p-1 rounded-lg">
                <PeriodButton value="daily" label="Diario" />
                <PeriodButton value="weekly" label="Semanal" />
                <PeriodButton value="monthly" label="Mensual" />
                <PeriodButton value="quarterly" label="Trimestral" />
            </div>
            <button 
                onClick={handleGenerateReport} 
                disabled={isLoading} 
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-wait transition"
            >
                {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <DocumentReportIcon className="w-5 h-5" />}
                {isLoading ? 'Generando...' : `Generar Reporte ${periodLabels[period]}`}
            </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl min-h-[60vh]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <SpinnerIcon className="w-12 h-12 animate-spin mb-4 text-cyan-500" />
            <p>Analizando datos y generando reporte con Gemini...</p>
            <p>Esto puede tardar unos segundos.</p>
          </div>
        ) : report ? (
            <MarkdownRenderer content={report} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <DocumentReportIcon className="w-24 h-24 mb-4" />
            <p className="text-lg">Seleccione un período y haga clic en "Generar Reporte" para ver el análisis.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGenerator;