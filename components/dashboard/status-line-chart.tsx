import { shortDateLabel } from "@/lib/hr-utils";

type TrendPoint = {
  date: string;
  active: number;
  leave: number;
  noInfo: number;
};

type StatusLineChartProps = {
  points: TrendPoint[];
};

export function StatusLineChart({ points }: StatusLineChartProps) {
  const width = 620;
  const height = 220;
  const maxValue = Math.max(1, ...points.flatMap((point) => [point.active, point.leave, point.noInfo]));
  const groupWidth = width / Math.max(points.length, 1);
  const groupInnerWidth = groupWidth * 0.7;
  const barWidth = groupInnerWidth / 3;

  return (
    <section className="rounded-3xl border bg-[hsl(var(--card))] p-4 shadow-sm md:p-6">
      <h2 className="text-xl font-bold text-[hsl(var(--card-foreground))]">Attendance Overview</h2>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Active, leave, and no-info counts over recent dates.</p>

      <div className="mt-5 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height + 30}`} className="min-w-[620px]" role="img" aria-label="Attendance trend bar chart">
          {[0.25, 0.5, 0.75, 1].map((tick) => {
            const y = height - tick * height;
            return <line key={tick} x1="0" y1={y} x2={width} y2={y} stroke="hsl(var(--muted-foreground) / 0.25)" strokeDasharray="4 4" />;
          })}

          {points.map((point, index) => {
            const groupStart = index * groupWidth + (groupWidth - groupInnerWidth) / 2;
            const activeHeight = (point.active / maxValue) * height;
            const leaveHeight = (point.leave / maxValue) * height;
            const noInfoHeight = (point.noInfo / maxValue) * height;

            return (
              <g key={point.date}>
                <rect
                  x={groupStart}
                  y={height - activeHeight}
                  width={barWidth - 1}
                  height={activeHeight}
                  rx="3"
                  fill="hsl(var(--chart-1))"
                />
                <rect
                  x={groupStart + barWidth}
                  y={height - leaveHeight}
                  width={barWidth - 1}
                  height={leaveHeight}
                  rx="3"
                  fill="hsl(var(--chart-2))"
                />
                <rect
                  x={groupStart + barWidth * 2}
                  y={height - noInfoHeight}
                  width={barWidth - 1}
                  height={noInfoHeight}
                  rx="3"
                  fill="hsl(var(--muted-foreground))"
                />
              </g>
            );
          })}

          {points.map((point, index) => {
            const x = points.length > 1 ? (index * width) / (points.length - 1) : width / 2;
            return (
              <text key={point.date} x={x} y={height + 20} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
                {shortDateLabel(point.date)}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
        <span className="rounded-full bg-[hsl(var(--chart-1)/0.2)] px-3 py-1 text-[hsl(var(--foreground))]">Active</span>
        <span className="rounded-full bg-[hsl(var(--chart-2)/0.2)] px-3 py-1 text-[hsl(var(--foreground))]">Leave</span>
        <span className="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-[hsl(var(--muted-foreground))]">No info</span>
      </div>
    </section>
  );
}
