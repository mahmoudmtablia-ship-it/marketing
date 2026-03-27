"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type ChartDatum = {
  name: string;
  value: number;
  color?: string;
};

const defaultData: ChartDatum[] = [
  { name: 'Amazon', value: 12400, color: '#f59e0b' },
  { name: 'BestBuy', value: 8300, color: '#3b82f6' },
  { name: 'Walmart', value: 3100, color: '#10b981' },
  { name: 'eBay', value: 1092, color: '#ef4444' },
];

const fallbackColors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#06b6d4', '#8b5cf6'];

function formatValue(value: number, mode: 'currency' | 'count') {
  if (mode === 'count') {
    return new Intl.NumberFormat('en-US').format(value);
  }

  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }

  return `$${value.toFixed(0)}`;
}

export function RevenueChart({
  data = defaultData,
  mode = 'currency',
}: {
  data?: ChartDatum[];
  mode?: 'currency' | 'count';
}) {
  return (
    <div className="w-full h-full min-h-[250px] pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatValue(Number(value), mode)}
          />
          <Tooltip 
            cursor={{fill: '#334155', opacity: 0.4}}
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
            formatter={(value) => formatValue(Number(value), mode)}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color ?? fallbackColors[index % fallbackColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
