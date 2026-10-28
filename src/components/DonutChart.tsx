'use client';

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  total: number;
  currency: string;
  size?: number;
}

export default function DonutChart({ segments, total, currency, size = 220 }: DonutChartProps) {
  const radius = 80;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Filter out zero-value segments
  const activeSegments = segments.filter(s => s.value > 0);
  const totalValue = activeSegments.reduce((s, seg) => s + seg.value, 0);

  let cumulativePercent = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          {/* Segments */}
          {activeSegments.map((seg, i) => {
            const percent = totalValue > 0 ? seg.value / totalValue : 0;
            const dashArray = `${circumference * percent} ${circumference * (1 - percent)}`;
            const dashOffset = -circumference * cumulativePercent;
            cumulativePercent += percent;

            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            );
          })}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {currency} {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
          </span>
        </div>
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
        {activeSegments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-slate-600 dark:text-slate-400 truncate">{seg.label}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 ml-auto">
              {totalValue > 0 ? Math.round((seg.value / totalValue) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
