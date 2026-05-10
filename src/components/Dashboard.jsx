import { useState } from "react";
import { Doughnut, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

function getDateRange(filter, customStart, customEnd) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (filter === "weekly") {
    const start = new Date(today);
    start.setDate(today.getDate() - 7);
    return { start, end: now };
  } else if (filter === "biweekly") {
    const start = new Date(today);
    start.setDate(today.getDate() - 14);
    return { start, end: now };
  } else if (filter === "monthly") {
    const start = new Date(today);
    start.setDate(today.getDate() - 30);
    return { start, end: now };
  } else if (filter === "custom" && customStart && customEnd) {
    return { start: new Date(customStart), end: new Date(customEnd) };
  }
  return null;
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: "#fff",
      border: "0.5px solid #e8e6e0",
      borderRadius: 14,
      padding: "18px 22px",
    }}>
      <p style={{ fontSize: 11, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-1.5px", fontFamily: "Georgia, serif" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "#ccc", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard({ expenses, categoryColors }) {
  const [filter, setFilter] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filters = [
    { key: "weekly", label: "Weekly" },
    { key: "biweekly", label: "Bi-weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "custom", label: "Custom" },
  ];

  const range = getDateRange(filter, customStart, customEnd);
  const filtered = range
    ? expenses.filter((e) => {
        const d = new Date(e.date);
        return d >= range.start && d <= range.end;
      })
    : expenses;

  if (expenses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#ccc" }}>
        <p style={{ fontSize: 36, marginBottom: 12 }}>📊</p>
        <p style={{ fontSize: 15, color: "#aaa", fontWeight: 600 }}>No data yet</p>
        <p style={{ fontSize: 13, marginTop: 6, color: "#ccc" }}>Add some expenses to see your dashboard</p>
      </div>
    );
  }

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);
  const avg = filtered.length > 0 ? total / filtered.length : 0;
  const highest = filtered.length > 0 ? Math.max(...filtered.map((e) => e.amount)) : 0;

  const byCategory = filtered.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  // Aggregate all items across filtered expenses
  const allItems = filtered.flatMap((e) => e.items || []);
  const byItem = allItems.reduce((acc, item) => {
    const key = item.name.toLowerCase();
    acc[key] = (acc[key] || 0) + item.amount;
    return acc;
  }, {});
  const topItems = Object.entries(byItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const categoryKeys = Object.keys(categoryColors);

  const doughnutData = {
    labels: Object.keys(byCategory),
    datasets: [{
      data: Object.values(byCategory),
      backgroundColor: Object.keys(byCategory).map((c) => categoryColors[c] || "#9a9a8a"),
      borderWidth: 0,
    }],
  };

  const radarData = {
    labels: categoryKeys,
    datasets: [{
      label: "Spending",
      data: categoryKeys.map((c) => byCategory[c] || 0),
      borderColor: "#1a1a1a",
      backgroundColor: "rgba(26,26,26,0.05)",
      pointBackgroundColor: categoryKeys.map((c) => categoryColors[c] || "#9a9a8a"),
      pointBorderColor: categoryKeys.map((c) => categoryColors[c] || "#9a9a8a"),
      pointHoverRadius: 6,
      pointRadius: 4,
      borderWidth: 1.5,
    }],
  };

  const inputStyle = {
    background: "#fff",
    border: "0.5px solid #e8e6e0",
    borderRadius: 8,
    padding: "5px 12px",
    fontSize: 12,
    color: "#1a1a1a",
    fontFamily: "Georgia, serif",
    outline: "none",
  };

  const cardStyle = {
    background: "#fff",
    border: "0.5px solid #e8e6e0",
    borderRadius: 14,
    padding: 24,
  };

  const sectionLabel = {
    fontSize: 11,
    color: "#bbb",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 20,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px", marginBottom: 4 }}>Overview</h1>
        <p style={{ fontSize: 13, color: "#bbb" }}>
          {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Filter Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              border: filter === f.key ? "0.5px solid #1a1a1a" : "0.5px solid #e8e6e0",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "Georgia, serif",
              background: filter === f.key ? "#1a1a1a" : "#fff",
              color: filter === f.key ? "#faf9f7" : "#999",
              transition: "all 0.15s ease",
            }}
          >
            {f.label}
          </button>
        ))}

        {filter === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, width: "100%" }}>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={inputStyle} />
            <span style={{ color: "#ccc", fontSize: 12 }}>to</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={inputStyle} />
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>🔍</p>
          <p style={{ fontSize: 13, color: "#bbb" }}>No expenses in this period</p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <StatCard label="Total spent" value={`$${total.toFixed(2)}`} sub={`${filtered.length} expenses`} />
            <StatCard label="Average" value={`$${avg.toFixed(2)}`} sub="per expense" />
            <StatCard label="Highest" value={`$${highest.toFixed(2)}`} sub="single expense" />
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={cardStyle}>
              <p style={sectionLabel}>By category</p>
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  plugins: { legend: { labels: { color: "#aaa", font: { size: 12, family: "Georgia, serif" }, boxWidth: 10, padding: 12 } } },
                }}
              />
            </div>
            <div style={cardStyle}>
              <p style={sectionLabel}>Category radar</p>
              <Radar
                data={radarData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    r: {
                      ticks: { display: false },
                      grid: { display: false },
                      angleLines: { display: false },
                      pointLabels: { color: "#aaa", font: { size: 11, family: "Georgia, serif" } },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Recent + Top Items */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* Recent Expenses */}
            <div style={cardStyle}>
              <p style={sectionLabel}>Recent</p>
              {filtered.slice(0, 5).map((expense, i) => (
                <div
                  key={expense.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 0",
                    borderBottom: i < Math.min(filtered.length, 5) - 1 ? "0.5px solid #f0ede8" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: categoryColors[expense.category] || "#9a9a8a",
                      flexShrink: 0,
                    }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{expense.title}</p>
                      <p style={{ fontSize: 11, color: "#ccc", marginTop: 1 }}>{expense.category} · {expense.date}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", fontFamily: "Georgia, serif", letterSpacing: "-0.5px" }}>
                    ${expense.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Top Items */}
            <div style={cardStyle}>
              <p style={sectionLabel}>Top items</p>
              {topItems.length === 0 ? (
                <p style={{ fontSize: 12, color: "#ccc", textAlign: "center", padding: "20px 0" }}>No items yet</p>
              ) : (
                topItems.map(([name, amount], i) => {
                  const maxAmount = topItems[0][1];
                  const pct = (amount / maxAmount) * 100;
                  return (
                    <div key={name} style={{
                      padding: "9px 0",
                      borderBottom: i < topItems.length - 1 ? "0.5px solid #f0ede8" : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: "#1a1a1a", textTransform: "capitalize", fontWeight: 500 }}>{name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", fontFamily: "Georgia, serif" }}>${amount.toFixed(2)}</span>
                      </div>
                      <div style={{ height: 3, background: "#f0ede8", borderRadius: 4 }}>
                        <div style={{ height: 3, width: `${pct}%`, background: "#1a1a1a", borderRadius: 4, transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}