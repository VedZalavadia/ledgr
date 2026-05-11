import { useState, useRef } from "react";
import { Trash2, ChevronDown, ChevronUp, Download, Upload } from "lucide-react";
import { importExpensesFromCSV } from "../db";

function exportToCSV(expenses) {
  const rows = [];
  rows.push(["Expense Title", "Category", "Date", "Total", "Item Name", "Item Amount", "Notes"]);

  expenses.forEach((expense) => {
    if (expense.items && expense.items.length > 0) {
      expense.items.forEach((item, i) => {
        rows.push([
          i === 0 ? expense.title : "",
          i === 0 ? expense.category : "",
          i === 0 ? expense.date : "",
          i === 0 ? expense.amount.toFixed(2) : "",
          item.name,
          item.amount.toFixed(2),
          i === 0 ? (expense.notes || "") : "",
        ]);
      });
    } else {
      rows.push([
        expense.title,
        expense.category,
        expense.date,
        expense.amount.toFixed(2),
        "",
        "",
        expense.notes || "",
      ]);
    }
  });

  const csv = rows.map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ledgr-export-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  return lines.slice(1).map((line) => {
    const cols = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  });
}

export default function ExpenseList({ expenses, onDelete, onImport, categoryColors }) {
  const [expanded, setExpanded] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const fileRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const count = await importExpensesFromCSV(rows);
      setImportMsg({ type: "success", text: `Successfully imported ${count} expense${count !== 1 ? "s" : ""}` });
      onImport();
    } catch (err) {
      console.error(err);
      setImportMsg({ type: "error", text: "Import failed — make sure it's a Ledgr CSV file" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    background: "#fff",
    border: "0.5px solid #e8e6e0",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    color: "#888",
    fontFamily: "Georgia, serif",
    transition: "all 0.15s ease",
  };

  if (expenses.length === 0) {
    return (
      <div>
        {/* Empty state with import button still visible */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px" }}>Expenses</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImport} />
            <button
              style={buttonStyle}
              onClick={() => fileRef.current.click()}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.color = "#1a1a1a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e6e0"; e.currentTarget.style.color = "#888"; }}
            >
              <Upload size={13} />
              {importing ? "Importing..." : "Import CSV"}
            </button>
          </div>
        </div>

        {importMsg && (
          <div style={{
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 12,
            marginBottom: 20,
            background: importMsg.type === "success" ? "#f0faf4" : "#fdf2f2",
            color: importMsg.type === "success" ? "#2e7d52" : "#c0392b",
            border: `0.5px solid ${importMsg.type === "success" ? "#b6e8cc" : "#f5c0c0"}`,
          }}>
            {importMsg.text}
          </div>
        )}

        <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>💸</p>
          <p style={{ fontSize: 15, color: "#aaa", fontWeight: 600 }}>No expenses yet</p>
          <p style={{ fontSize: 13, marginTop: 6, color: "#ccc" }}>Add your first expense to get started</p>
        </div>
      </div>
    );
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px" }}>Expenses</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#bbb", marginRight: 8 }}>
            Total:{" "}
            <span style={{ color: "#1a1a1a", fontWeight: 700, fontFamily: "Georgia, serif", letterSpacing: "-0.5px" }}>
              ${total.toFixed(2)}
            </span>
          </span>

          {/* Import */}
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImport} />
          <button
            style={buttonStyle}
            onClick={() => fileRef.current.click()}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.color = "#1a1a1a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e6e0"; e.currentTarget.style.color = "#888"; }}
          >
            <Upload size={13} />
            {importing ? "Importing..." : "Import CSV"}
          </button>

          {/* Export */}
          <button
            onClick={() => exportToCSV(expenses)}
            style={buttonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.color = "#1a1a1a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e6e0"; e.currentTarget.style.color = "#888"; }}
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Import message */}
      {importMsg && (
        <div style={{
          padding: "10px 16px",
          borderRadius: 10,
          fontSize: 12,
          marginBottom: 20,
          background: importMsg.type === "success" ? "#f0faf4" : "#fdf2f2",
          color: importMsg.type === "success" ? "#2e7d52" : "#c0392b",
          border: `0.5px solid ${importMsg.type === "success" ? "#b6e8cc" : "#f5c0c0"}`,
        }}>
          {importMsg.text}
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {expenses.map((expense) => {
          const isExpanded = expanded === expense.id;
          return (
            <div
              key={expense.id}
              style={{
                background: "#fff",
                border: "0.5px solid #e8e6e0",
                borderRadius: 14,
                overflow: "hidden",
                transition: "border-color 0.15s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#c8c5be"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e8e6e0"}
            >
              {/* Main Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  cursor: expense.items?.length > 0 ? "pointer" : "default",
                }}
                onClick={() => expense.items?.length > 0 && setExpanded(isExpanded ? null : expense.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: categoryColors[expense.category] || "#9a9a8a",
                    flexShrink: 0,
                  }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>{expense.title}</p>
                    <p style={{ fontSize: 11, color: "#ccc" }}>{expense.category} · {expense.date}</p>
                    {expense.notes && (
                      <p style={{ fontSize: 11, color: "#ddd", marginTop: 2 }}>{expense.notes}</p>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", fontFamily: "Georgia, serif", letterSpacing: "-0.5px" }}>
                    ${expense.amount.toFixed(2)}
                  </span>
                  {expense.items?.length > 0 && (
                    <span style={{ color: "#ccc" }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ddd",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#e55"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#ddd"}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded Items */}
              {isExpanded && expense.items?.length > 0 && (
                <div style={{ borderTop: "0.5px solid #f0ede8", padding: "12px 20px 14px 42px" }}>
                  {expense.items.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: i < expense.items.length - 1 ? "0.5px solid #f8f6f2" : "none",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#888", textTransform: "capitalize" }}>{item.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#888", fontFamily: "Georgia, serif" }}>
                        ${item.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}