import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { ChoiceResult } from "../../types";

interface ChoiceChartProps {
  result: ChoiceResult;
}

export default function ChoiceChart({ result }: ChoiceChartProps) {
  const data = Object.entries(result.counts).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div style={{ marginBottom: "0.5rem", fontSize: "0.8125rem", color: "#6b7280" }}>
        Total responses: {result.total}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
          <XAxis dataKey="name" fontSize={11} />
          <YAxis allowDecimals={false} fontSize={11} />
          <Tooltip />
          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {/* Option breakdown table */}
      <div style={{ marginTop: "0.75rem", fontSize: "0.8125rem" }}>
        {data.map(({ name, value }) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ color: "#374151" }}>{name}</span>
            <span style={{ color: "#6b7280" }}>
              {value} ({result.total > 0 ? ((value / result.total) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
