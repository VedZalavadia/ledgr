import { useState } from "react";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

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

function buildTrendData(filtered, filter, customStart, customEnd) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === "weekly" || filter === "biweekly") {
    const days = filter === "weekly" ? 7 : 14;
    const labels = [];
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      labels.push(d.toLocaleString("default", { month: "short", day: "numeric" }));
      const total = filtered
        .filter((e) => e.date === key)
        .reduce((sum, e) => sum + e.amount, 0);
      data.push(total);
    }
    return { labels, data };
  }

  if (filter === "monthly") {
    const weeks = [[], [], [], []];
    const weekLabels = [];
    for (let i = 0; i < 4; i++) {
      const start = new Date(today);
      start.setDate(today.getDate() - (30 - i * 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      weekLabels.push(`${start.toLocaleString("default", { month: "short", day: "numeric" })}`);
      const total = filtered
        .filter((e) => {
          const d = new Date(e.date);
          return d >= start && d <= end;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      weeks[i] = total;
    }
    return { labels: weekLabels, data: weeks };
  }

  if (filter === "custom" && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const labels = [];
    const data = [];
    if (diffDays <= 14) {
      for (let i = 0; i <= diffDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = d.toISOString().split("T")[0];
        labels.push(d.toLocaleString("default", { month: "short", day: "numeric" }));
        const total = filtered.filter((e) => e.date === key).reduce((sum, e) => sum + e.amount, 0);
        data.push(total);
      }
    } else {
      const weeks = Math.ceil(diffDays / 7);
      for (let i = 0; i < weeks; i++) {
        const wStart = new Date(start);
        wStart.setDate(start.getDate() + i * 7);
        const wEnd = new Date(wStart);
        wEnd.setDate(wStart.getDate() + 6);
        labels.push(wStart.toLocaleString("default", { month: "short", day: "numeric" }));
        const total = filtered
          .filter((e) => { const d = new Date(e.date); return d >= wStart && d <= wEnd; })
          .reduce((sum, e) => sum + e.amount, 0);
        data.push(total);
      }
    }
    return { labels, data };
  }

  return { labels: [], data: [] };
}

function StatCard({ label, value, sub, subColor }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid #e8e6e0", borderRadius: 14, padding: "18px 22px" }}>
      <p style={{ fontSize: 11, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-1px", fontFamily: "Georgia, serif" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, marginTop: 4, color: subColor || "#ccc" }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard({ expenses, categoryColors }) {
  const [filter, setFilter] = useState("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const filters = [
    { key: "weekly", label: "Weekly" },
    { key: "biweekly", label: "Bi-weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "custom", label: "Custom" },
  ];

  const range = getDateRange(filter, customStart, customEnd);
  const filtered = range
    ? expenses.filter((e) => { const d = new Date(e.date); return d >= range.start && d <= range.end; })
    : expenses;

  if (expenses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#ccc" }}>
        <p style={{ fontSize: 36, marginBottom: 12 }}>📊</p>
        <p style={{ fontSize: 15, color: "#aaa", fontWeight: 600 }}>No data yet</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Add some expenses to see your dashboard</p>
      </div>
    );
  }

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);
  const days = filter === "weekly" ? 7 : filter === "biweekly" ? 14 : 30;
  const dailyAvg = total / days;

  const byCategory = filtered.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  const allItems = filtered.flatMap((e) => e.items || []);
  const byItem = allItems.reduce((acc, item) => {
    const key = item.name.toLowerCase();
    acc[key] = (acc[key] || 0) + item.amount;
    return acc;
  }, {});
  const allTopItems = Object.entries(byItem).sort((a, b) => b[1] - a[1]);
  const filteredItems = itemSearch.trim()
    ? allTopItems.filter(([name]) => name.includes(itemSearch.toLowerCase()))
    : allTopItems.slice(0, 8);

  const doughnutData = {
    labels: Object.keys(byCategory),
    datasets: [{
      data: Object.values(byCategory),
      backgroundColor: Object.keys(byCategory).map((c) => categoryColors[c] || "#9a9a8a"),
      borderWidth: 0,
    }],
  };

  const { labels: trendLabels, data: trendData } = buildTrendData(filtered, filter, customStart, customEnd);

  const lineData = {
    labels: trendLabels,
    datasets: [{
      label: "Spending",
      data: trendData,
      borderColor: "#1a1a1a",
      backgroundColor: "rgba(26,26,26,0.05)",
      pointBackgroundColor: trendData.map((_, i) =>
        i >= trendData.length - 2 ? "#cc2936" : "#1a1a1a"
      ),
      pointRadius: 3.5,
      pointHoverRadius: 5,
      tension: 0.4,
      fill: true,
      borderWidth: 1.5,
    }],
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#ccc", font: { size: 10, family: "Georgia, serif" } }, grid: { display: false } },
      y: { ticks: { color: "#ccc", font: { size: 10 }, callback: (v) => `$${v}` }, grid: { color: "#f5f4f0" }, border: { display: false } },
    },
  };

  const inputStyle = {
    background: "#fff", border: "0.5px solid #e8e6e0", borderRadius: 8,
    padding: "5px 12px", fontSize: 12, color: "#1a1a1a",
    fontFamily: "Georgia, serif", outline: "none",
  };

  const cardStyle = { background: "#fff", border: "0.5px solid #e8e6e0", borderRadius: 14, padding: 24 };
  const sectionLabel = { fontSize: 11, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px", marginBottom: 4 }}>Overview</h1>
        <p style={{ fontSize: 13, color: "#bbb" }}>{new Date().toLocaleString("default", { month: "long", year: "numeric" })}</p>
      </div>

      {/* Filter Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: "5px 14px", borderRadius: 20,
            border: filter === f.key ? "0.5px solid #1a1a1a" : "0.5px solid #e8e6e0",
            cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif",
            background: filter === f.key ? "#1a1a1a" : "#fff",
            color: filter === f.key ? "#faf9f7" : "#999",
            transition: "all 0.15s ease",
          }}>{f.label}</button>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            <StatCard label="Total spent" value={`$${total.toFixed(2)}`} sub={`${filtered.length} expenses`} />
            <StatCard label="Daily average" value={`$${dailyAvg.toFixed(2)}`} sub="per day this period" />
            <StatCard
              label="Top category"
              value={topCategory ? topCategory[0] : "—"}
              sub={topCategory ? `$${topCategory[1].toFixed(2)} this period` : ""}
              subColor="#2e7d52"
            />
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <div style={cardStyle}>
              <p style={sectionLabel}>By category</p>
              <Doughnut data={doughnutData} options={{
                responsive: true,
                plugins: { legend: { labels: { color: "#aaa", font: { size: 11, family: "Georgia, serif" }, boxWidth: 10, padding: 10 } } },
              }} />
            </div>
            <div style={cardStyle}>
              <p style={sectionLabel}>Spending trend</p>
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>

          {/* Recent + Top Items */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <div style={cardStyle}>
              <p style={sectionLabel}>Recent</p>
              {filtered.slice(0, 5).map((expense, i) => (
                <div key={expense.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "11px 0",
                  borderBottom: i < Math.min(filtered.length, 5) - 1 ? "0.5px solid #f0ede8" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: categoryColors[expense.category] || "#9a9a8a", flexShrink: 0 }} />
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

            {/* Top Items with Search */}
            <div style={cardStyle}>
              <p style={sectionLabel}>Top items</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f5f4f0", borderRadius: 8, padding: "7px 12px", marginBottom: 12 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#1a1a1a", fontFamily: "Georgia, serif", width: "100%" }}
                />
                {itemSearch && (
                  <button onClick={() => setItemSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                )}
              </div>

              {filteredItems.length === 0 ? (
                <p style={{ fontSize: 12, color: "#ccc", textAlign: "center", padding: "16px 0" }}>
                  {itemSearch ? `No items matching "${itemSearch}"` : "No items yet"}
                </p>
              ) : (
                filteredItems.map(([name, amount], i) => {
                  const maxAmount = allTopItems[0][1];
                  const pct = (amount / maxAmount) * 100;
                  return (
                    <div key={name} style={{ padding: "9px 0", borderBottom: i < filteredItems.length - 1 ? "0.5px solid #f0ede8" : "none" }}>
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