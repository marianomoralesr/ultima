import React from 'react';
import { Users, MessageSquare, FileText, Settings, CheckCircle, TrendingDown } from 'lucide-react';

interface ConversionFunnelProps {
    metrics: {
        totalLeads: number;
        contactedLeads: number;
        totalApplications: number;
        processedApplications: number;
        approvedApplications: number;
    };
}

const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ metrics }) => {
    // Calculate funnel stages
    const stages = [
        {
            name: 'Leads Totales',
            count: metrics.totalLeads,
            icon: <Users className="w-5 h-5" />,
            color: 'bg-blue-500',
            textColor: 'text-blue-700',
            bgLight: 'bg-blue-50'
        },
        {
            name: 'Contactados',
            count: metrics.contactedLeads,
            icon: <MessageSquare className="w-5 h-5" />,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-700',
            bgLight: 'bg-indigo-50',
            conversionRate: metrics.totalLeads > 0
                ? ((metrics.contactedLeads / metrics.totalLeads) * 100).toFixed(1)
                : '0'
        },
        {
            name: 'Solicitudes',
            count: metrics.totalApplications,
            icon: <FileText className="w-5 h-5" />,
            color: 'bg-purple-500',
            textColor: 'text-purple-700',
            bgLight: 'bg-purple-50',
            conversionRate: metrics.contactedLeads > 0
                ? ((metrics.totalApplications / metrics.contactedLeads) * 100).toFixed(1)
                : '0'
        },
        {
            name: 'Procesadas',
            count: metrics.processedApplications,
            icon: <Settings className="w-5 h-5" />,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-700',
            bgLight: 'bg-yellow-50',
            conversionRate: metrics.totalApplications > 0
                ? ((metrics.processedApplications / metrics.totalApplications) * 100).toFixed(1)
                : '0'
        },
        {
            name: 'Aprobadas',
            count: metrics.approvedApplications,
            icon: <CheckCircle className="w-5 h-5" />,
            color: 'bg-green-500',
            textColor: 'text-green-700',
            bgLight: 'bg-green-50',
            conversionRate: metrics.processedApplications > 0
                ? ((metrics.approvedApplications / metrics.processedApplications) * 100).toFixed(1)
                : '0'
        }
    ];

    const maxCount = Math.max(...stages.map(s => s.count), 1);

    return (
        <div className="space-y-4">
            {stages.map((stage, index) => {
                const widthPercentage = (stage.count / maxCount) * 100;
                const dropOff = index > 0 ? stages[index - 1].count - stage.count : 0;
                const showWarning = stage.conversionRate && parseFloat(stage.conversionRate) < 50;

                return (
                    <div key={stage.name} className="relative">
                        {/* Stage Container */}
                        <div className={`${stage.bgLight} rounded-lg p-4 border-2 border-gray-100 hover:border-gray-200 transition-all`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`${stage.color} p-2 rounded-lg text-white`}>
                                        {stage.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{stage.name}</h4>
                                        {stage.conversionRate && (
                                            <p className="text-xs text-gray-500">
                                                {stage.conversionRate}% de la etapa anterior
                                                {showWarning && (
                                                    <span className="ml-1 text-red-600">⚠️</span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-2xl font-bold ${stage.textColor}`}>{stage.count}</p>
                                    {dropOff > 0 && (
                                        <p className="text-xs text-red-600 flex items-center gap-1 justify-end">
                                            <TrendingDown className="w-3 h-3" />
                                            -{dropOff}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className={`${stage.color} h-2 rounded-full transition-all duration-500`}
                                    style={{ width: `${widthPercentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Connector Arrow */}
                        {index < stages.length - 1 && (
                            <div className="flex justify-center my-1">
                                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-gray-300" />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Overall Conversion Summary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Resumen de Conversión</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-600">Lead → Solicitud</p>
                        <p className="text-xl font-bold text-blue-700">
                            {metrics.totalLeads > 0
                                ? ((metrics.totalApplications / metrics.totalLeads) * 100).toFixed(1)
                                : '0'}%
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600">Solicitud → Aprobación</p>
                        <p className="text-xl font-bold text-green-700">
                            {metrics.totalApplications > 0
                                ? ((metrics.approvedApplications / metrics.totalApplications) * 100).toFixed(1)
                                : '0'}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConversionFunnel;
