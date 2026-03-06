"use client";

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';


// Colors used for the charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

// Specific colors for each lead status
const STATUS_COLORS = {
    'New': '#3b82f6', // blue
    'Contacted': '#eab308', // yellow
    'Follow-up': '#f97316', // orange
    'Negotiation': '#8b5cf6', // purple
    'Converted': '#22c55e', // green
    'Lost': '#ef4444', // red
};

/**
 * PIE CHART COMPONENT
 * 
 * This shows a "donut" chart of leads grouped by their status.
 */
export function LeadStatusChart({ leads }) {
    // We use 'useMemo' so this calculation only runs when the 'leads' data changes.
    const data = useMemo(() => {
        // Count how many leads are in each status
        const statusCounts = leads.reduce((acc, lead) => {
            const status = lead.status || 'Unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        // Turn the counts into a format that the 'Recharts' library understands
        return Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value);
    }, [leads]);

    if (!leads.length) return <div className="p-4 text-center text-gray-500 text-sm">No data to display</div>;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Leads by Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                isAnimationActive={true}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                formatter={(value) => [`${value} Leads`, 'Count']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * BAR CHART COMPONENT
 * 
 * This shows which products the leads are most interested in.
 */
export function LeadProductChart({ leads }) {
    const data = useMemo(() => {
        // Count how many people like each product
        const productCounts = leads.reduce((acc, lead) => {
            const product = lead.product_interest || 'Unknown';
            acc[product] = (acc[product] || 0) + 1;
            return acc;
        }, {});

        // Format for the bar chart and take the Top 5
        return Object.entries(productCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [leads]);

    if (!leads.length) return <div className="p-4 text-center text-gray-500 text-sm">No data to display</div>;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Top Products of Interest</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                allowDecimals={false}
                            />
                            <RechartsTooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar
                                dataKey="count"
                                name="Leads"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                isAnimationActive={true}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

