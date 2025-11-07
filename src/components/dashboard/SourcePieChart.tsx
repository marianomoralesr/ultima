import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Facebook, Globe, Bot, MousePointerClick, HelpCircle } from 'lucide-react';

interface SourcePieChartProps {
    data: {
        facebook: number;
        google: number;
        bot: number;
        direct: number;
        other: number;
    };
    height?: number;
}

const SourcePieChart: React.FC<SourcePieChartProps> = ({ data, height = 300 }) => {
    // Transform data for recharts
    const chartData = [
        { name: 'Facebook', value: data.facebook, color: '#3b82f6', icon: 'facebook' },
        { name: 'Google', value: data.google, color: '#ef4444', icon: 'google' },
        { name: 'Bot/WhatsApp', value: data.bot, color: '#10b981', icon: 'bot' },
        { name: 'Directo', value: data.direct, color: '#8b5cf6', icon: 'direct' },
        { name: 'Otros', value: data.other, color: '#6b7280', icon: 'other' }
    ].filter(item => item.value > 0); // Only show sources with data

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                <p>No hay datos de fuentes disponibles</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percentage = ((data.value / total) * 100).toFixed(1);
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-900">{data.name}</p>
                    <p className="text-sm text-gray-600">
                        {data.value} leads ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null; // Don't show label for small slices

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="font-bold text-sm"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div>
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        animationDuration={1000}
                        animationBegin={0}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value, entry: any) => {
                            const item = chartData.find(d => d.name === value);
                            return `${value} (${item?.value || 0})`;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Source breakdown cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                {chartData.map((source) => {
                    const percentage = ((source.value / total) * 100).toFixed(1);
                    return (
                        <div
                            key={source.name}
                            className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                        >
                            <div
                                className="inline-flex p-2 rounded-full mb-2"
                                style={{ backgroundColor: `${source.color}20` }}
                            >
                                {source.icon === 'facebook' && <Facebook className="w-4 h-4" style={{ color: source.color }} />}
                                {source.icon === 'google' && <Globe className="w-4 h-4" style={{ color: source.color }} />}
                                {source.icon === 'bot' && <Bot className="w-4 h-4" style={{ color: source.color }} />}
                                {source.icon === 'direct' && <MousePointerClick className="w-4 h-4" style={{ color: source.color }} />}
                                {source.icon === 'other' && <HelpCircle className="w-4 h-4" style={{ color: source.color }} />}
                            </div>
                            <p className="text-xs font-medium text-gray-600">{source.name}</p>
                            <p className="text-lg font-bold text-gray-900">{source.value}</p>
                            <p className="text-xs text-gray-500">{percentage}%</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SourcePieChart;
