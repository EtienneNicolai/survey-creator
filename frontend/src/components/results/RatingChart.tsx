import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { RatingResult } from "../../types";

interface RatingChartProps {
  result: RatingResult;
}

export default function RatingChart({ result }: RatingChartProps) {
  const data = Object.entries(result.distribution)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#6366f1" }}>{result.mean.toFixed(2)}</div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Mean</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#0ea5e9" }}>{result.median}</div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Median</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
          <XAxis dataKey="name" fontSize={11} />
          <YAxis allowDecimals={false} fontSize={11} />
          <Tooltip />
          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
            {data.map((_, idx) => (
              <Cell key={idx} fill="#6366f1" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
