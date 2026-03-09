import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, LineChart, Line } from 'recharts';

const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendUp = true,
    color = 'primary',
    className = '',
    chartData = null, // Expects array of objects with 'value' key
}) => {
    const colorStyles = {
        primary: {
            iconBg: 'bg-primary-500/20',
            iconColor: 'text-primary-400',
            accent: 'from-primary-500',
            chartColor: '#0ea5e9' // sky-500
        },
        success: {
            iconBg: 'bg-emerald-500/20',
            iconColor: 'text-emerald-400',
            accent: 'from-emerald-500',
            chartColor: '#10b981' // emerald-500
        },
        danger: {
            iconBg: 'bg-red-500/20',
            iconColor: 'text-red-400',
            accent: 'from-red-500',
            chartColor: '#ef4444' // red-500
        },
        warning: {
            iconBg: 'bg-amber-500/20',
            iconColor: 'text-amber-400',
            accent: 'from-amber-500',
            chartColor: '#f59e0b' // amber-500
        },
        info: {
            iconBg: 'bg-blue-500/20',
            iconColor: 'text-blue-400',
            accent: 'from-blue-500',
            chartColor: '#3b82f6' // blue-500
        },
        purple: {
            iconBg: 'bg-violet-500/20',
            iconColor: 'text-violet-400',
            accent: 'from-violet-500',
            chartColor: '#8b5cf6' // violet-500
        },
    };

    const styles = colorStyles[color] || colorStyles.primary;

    return (
        <div className={`stat-card animate-fadeInUp relative overflow-hidden group ${className}`}>
            {/* Accent line */}
            <div
                className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${styles.accent} to-transparent opacity-80`}
            />

            <div className="relative z-10 flex items-center justify-between h-full">
                {/* Icon */}
                <div className={`p-3 rounded-xl ${styles.iconBg} backdrop-blur-sm self-start mt-1`}>
                    <Icon className={`h-6 w-6 ${styles.iconColor}`} />
                </div>

                {/* Stats */}
                <div className="text-right flex flex-col items-end">
                    <div className="text-2xl font-bold text-white mb-1 tracking-tight">
                        {value}
                    </div>
                    <div className="text-sm text-gray-400 font-medium tracking-wide font-mono opacity-80 uppercase text-[10px]">
                        {title}
                    </div>
                    {trend && (
                        <div className={`text-xs font-medium mt-1 flex items-center justify-end gap-1 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trendUp ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : (
                                <TrendingDown className="h-3 w-3" />
                            )}
                            <span>{trend}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Mini Chart Background */}
            {chartData && chartData.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={styles.chartColor} stopOpacity={0.5} />
                                    <stop offset="100%" stopColor={styles.chartColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={styles.chartColor}
                                strokeWidth={2}
                                fill={`url(#gradient-${color})`}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default StatCard;
