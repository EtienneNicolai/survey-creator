import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, Legend } from "recharts";
import type { NpsResult } from "../../types";

interface NpsChartProps {
  result: NpsResult;
}

export default function NpsChart({ result }: NpsChartProps) {
  const data = [
    { name: "Detractors", value: result.detractor_pct, count: result.detractor_count, fill: "#ef4444" },
    { name: "Passives", value: result.passive_pct, count: result.passive_count, fill: "#f59e0b" },
    { name: "Promoters", value: result.promoter_pct, count: result.promoter_count, fill: "#22c55e" },
  ];

  const scoreColor = result.score >= 50 ? "#22c55e" : result.score >= 0 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      {/* Score display */}
      <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
            {result.score > 0 ? "+" : ""}{result.score}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem", fontWeight: 600, letterSpacing: "0.05em" }}>NPS SCORE</div>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#22c55e" }}>{result.promoter_pct.toFixed(1)}%</div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Promoters</div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{result.promoter_count} resp.</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b" }}>{result.passive_pct.toFixed(1)}%</div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Passives</div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{result.passive_count} resp.</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ef4444" }}>{result.detractor_pct.toFixed(1)}%</div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Detractors</div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{result.detractor_count} resp.</div>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} />
          <YAxis type="category" dataKey="name" width={80} fontSize={11} />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
