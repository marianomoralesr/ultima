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
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stages.map((stage, index) => {
                const widthPercentage = (stage.count / maxCount) * 100;
                const dropOff = index > 0 ? stages[index - 1].count - stage.count : 0;
                const showWarning = stage.conversionRate && parseFloat(stage.conversionRate) < 50;

                return (
                    <React.Fragment key={stage.name}>
                        {/* Stage Container */}
                        <div className={`${stage.bgLight} rounded-lg p-2 border border-gray-200 hover:border-gray-300 transition-all flex-shrink-0 w-32`}>
                            <div className="flex flex-col items-center text-center">
                                <div className={`${stage.color} p-1.5 rounded-lg text-white mb-1.5`}>
                                    {stage.icon}
                                </div>
                                <h4 className="font-semibold text-xs text-gray-900 mb-1">{stage.name}</h4>
                                <p className={`text-xl font-bold ${stage.textColor} mb-1`}>{stage.count}</p>

                                {stage.conversionRate && (
                                    <p className="text-[10px] text-gray-500 mb-1">
                                        {stage.conversionRate}%
                                        {showWarning && (
                                            <span className="ml-0.5 text-red-600">⚠️</span>
                                        )}
                                    </p>
                                )}

                                {dropOff > 0 && (
                                    <p className="text-[10px] text-red-600 flex items-center gap-0.5">
                                        <TrendingDown className="w-2.5 h-2.5" />
                                        -{dropOff}
                                    </p>
                                )}

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-1 mt-1.5">
                                    <div
                                        className={`${stage.color} h-1 rounded-full transition-all duration-500`}
                                        style={{ width: `${widthPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Connector Arrow - Horizontal */}
                        {index < stages.length - 1 && (
                            <div className="flex items-center flex-shrink-0">
                                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-gray-300" />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}

        </div>
    );
};

export default ConversionFunnel;
