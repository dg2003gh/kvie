"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";

interface chartDataType {
  name: string;
  value: number;
}

export default function Chart({ data }: { data: Array<chartDataType> }) {
  return (
    <div className="w-full h-64">
      {/* give a fixed height or the container will collapse */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
        >
          {/* gradient for nicer fill */}
          <defs>
            <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#31d0aa" stopOpacity={0.65} />
              <stop offset="80%" stopColor="#31d0aa" stopOpacity={0.06} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} />
          {/* the visible stroke line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#31d0aa"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2 }}
            isAnimationActive={false}
          />

          {/* area under the line (fill). uses the same dataKey */}
          <Area
            type="monotone"
            dataKey="value"
            stroke={undefined} // hide duplicate stroke
            fill="url(#gradGreen)" // gradient id from defs
            fillOpacity={1}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
