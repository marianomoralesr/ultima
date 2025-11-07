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
            icon: <Users className="w-6 h-6" />,
            color: 'bg-orange-500',
            textColor: 'text-orange-700',
            bgLight: 'bg-orange-50',
            borderColor: 'border-orange-200'
        },
        {
            name: 'Contactados',
            count: metrics.contactedLeads,
            icon: <MessageSquare className="w-6 h-6" />,
            color: 'bg-orange-500',
            textColor: 'text-orange-700',
            bgLight: 'bg-orange-100',
            borderColor: 'border-orange-200',
            conversionRate: metrics.totalLeads > 0
                ? ((metrics.contactedLeads / metrics.totalLeads) * 100).toFixed(1)
                : '0'
        },
        {
            name: 'Solicitudes',
            count: metrics.totalApplications,
            icon: <FileText className="w-6 h-6" />,
            color: 'bg-orange-500',
            textColor: 'text-orange-700',
            bgLight: 'bg-orange-50',
            borderColor: 'border-orange-200',
            conversionRate: metrics.contactedLeads > 0
                ? ((metrics.totalApplications / metrics.contactedLeads) * 100).toFixed(1)
                : '0'
        },
        {
            name: 'Procesadas',
            count: metrics.processedApplications,
            icon: <Settings className="w-6 h-6" />,
            color: 'bg-gray-500',
            textColor: 'text-gray-700',
            bgLight: 'bg-gray-50',
            borderColor: 'border-gray-200',
            conversionRate: metrics.totalApplications > 0
                ? ((metrics.processedApplications / metrics.totalApplications) * 100).toFixed(1)
                : '0'
        },
        {
            name: 'Aprobadas',
            count: metrics.approvedApplications,
            icon: <CheckCircle className="w-6 h-6" />,
            color: 'bg-gray-500',
            textColor: 'text-gray-700',
            bgLight: 'bg-gray-100',
            borderColor: 'border-gray-200',
            conversionRate: metrics.processedApplications > 0
                ? ((metrics.approvedApplications / metrics.processedApplications) * 100).toFixed(1)
                : '0'
        }
    ];

    const maxCount = Math.max(...stages.map(s => s.count), 1);

    return (
        <div className="w-full">
            {/* Desktop: Horizontal Layout - All 5 stages in one row */}
            <div className="hidden md:flex md:items-stretch md:gap-2">
                {stages.map((stage, index) => {
                    const widthPercentage = (stage.count / maxCount) * 100;
                    const dropOff = index > 0 ? stages[index - 1].count - stage.count : 0;
                    const showWarning = stage.conversionRate && parseFloat(stage.conversionRate) < 50;

                    const bgClasses = {
                        orange: 'bg-orange-50',
                        gray: 'bg-gray-50'
                    };

                    const borderClasses = {
                        orange: 'border-orange-200',
                        gray: 'border-gray-200'
                    };

                    const iconBgClasses = {
                        orange: 'bg-orange-100 text-orange-600',
                        gray: 'bg-gray-100 text-gray-600'
                    };

                    const colorKey = stage.color.replace('bg-', '').replace('-500', '') as keyof typeof bgClasses;

                    return (
                        <React.Fragment key={stage.name}>
                            {/* Stage Container - Same style as source attribution, equal width */}
                            <div className={`text-center p-4 rounded-xl ${bgClasses[colorKey]} border-2 ${borderClasses[colorKey]} hover:shadow-md transition-all flex-1 flex flex-col justify-between`}>
                                <div className="flex flex-col items-center">
                                    <div className={`inline-flex p-3 rounded-xl ${iconBgClasses[colorKey]} mb-3 shadow-sm`}>
                                        {stage.icon}
                                    </div>
                                    <p className="text-2xl font-black text-gray-900 mb-1">{stage.count}</p>
                                    <p className="text-xs font-semibold text-gray-600 mb-2">{stage.name}</p>

                                    <div className="space-y-1 w-full">
                                        {stage.conversionRate && (
                                            <div className="inline-block px-2 py-1 bg-white rounded-full shadow-sm border border-gray-200">
                                                <p className={`text-xs font-bold ${showWarning ? 'text-red-600' : 'text-gray-700'}`}>
                                                    {stage.conversionRate}%
                                                    {showWarning && <span className="ml-1">⚠️</span>}
                                                </p>
                                            </div>
                                        )}

                                        {dropOff > 0 && (
                                            <div className="flex items-center justify-center gap-1 text-xs text-red-600 font-medium">
                                                <TrendingDown className="w-2.5 h-2.5" />
                                                <span>-{dropOff}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Connector Arrow - Smaller */}
                            {index < stages.length - 1 && (
                                <div className="flex items-center justify-center flex-shrink-0">
                                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-gray-400" />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Mobile: Vertical Layout */}
            <div className="md:hidden space-y-4">
                {stages.map((stage, index) => {
                    const widthPercentage = (stage.count / maxCount) * 100;
                    const dropOff = index > 0 ? stages[index - 1].count - stage.count : 0;
                    const showWarning = stage.conversionRate && parseFloat(stage.conversionRate) < 50;

                    return (
                        <div key={stage.name}>
                            <div className={`${stage.bgLight} rounded-xl p-5 border-2 ${stage.borderColor}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`${stage.color} p-3 rounded-xl text-white shadow-sm flex-shrink-0`}>
                                        {stage.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm text-gray-900 mb-1">{stage.name}</h4>
                                        <p className={`text-2xl font-bold ${stage.textColor}`}>{stage.count}</p>

                                        <div className="flex items-center gap-2 mt-2">
                                            {stage.conversionRate && (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    showWarning ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {stage.conversionRate}%
                                                </span>
                                            )}
                                            {dropOff > 0 && (
                                                <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                                    <TrendingDown className="w-3 h-3" />
                                                    -{dropOff}
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                            <div
                                                className={`${stage.color} h-2 rounded-full transition-all duration-500`}
                                                style={{ width: `${widthPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Down Arrow for Mobile */}
                            {index < stages.length - 1 && (
                                <div className="flex justify-center py-2">
                                    <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-gray-400" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ConversionFunnel;
