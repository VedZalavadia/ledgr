import { useState, useRef } from "react";
import { Trash2, ChevronDown, ChevronUp, Download, Upload, Pencil } from "lucide-react";
import { importExpensesFromCSV } from "../db";

const CATEGORIES = ["Groceries", "Dining", "Transport", "Entertainment", "Shopping", "Other"];

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
      rows.push([expense.title, expense.category, expense.date, expense.amount.toFixed(2), "", "", expense.notes || ""]);
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
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { cols.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    cols.push(current.trim());
    return cols;
  });
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,26,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#faf9f7", border: "0.5px solid #e8e6e0", borderRadius: 16,
        padding: 28, width: 380,
      }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", fontFamily: "Georgia, serif", marginBottom: 8 }}>{title}</p>
        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px 0", border: "0.5px solid #e8e6e0", borderRadius: 8,
            background: "#fff", fontSize: 13, color: "#888", fontFamily: "Georgia, serif", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
            background: "#1a1a1a", fontSize: 13, color: "#faf9f7",
            fontFamily: "Georgia, serif", cursor: "pointer", fontWeight: 600,
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ expense, onSave, onClose }) {
  const [form, setForm] = useState({
    title: expense.title,
    category: expense.category,
    date: expense.date,
    notes: expense.notes || "",
  });
  const [items, setItems] = useState(expense.items ? [...expense.items] : []);
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");

  const addItem = () => {
    if (!itemName || !itemAmount) return;
    setItems([...items, { name: itemName, amount: parseFloat(itemAmount) }]);
    setItemName("");
    setItemAmount("");
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const total = items.reduce((sum, i) => sum + i.amount, 0);

  const handleSave = () => {
    if (!form.title || items.length === 0) return;
    onSave({ ...expense, ...form, amount: total }, items);
    onClose();
  };

  const inputStyle = {
    width: "100%", background: "#fff", border: "0.5px solid #e8e6e0",
    borderRadius: 8, padding: "8px 12px", fontSize: 13,
    color: "#1a1a1a", fontFamily: "Georgia, serif", outline: "none",
  };

  const labelStyle = {
    fontSize: 11, color: "#bbb", textTransform: "uppercase",
    letterSpacing: "0.06em", marginBottom: 5, display: "block",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,26,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#faf9f7", border: "0.5px solid #e8e6e0", borderRadius: 16,
        padding: 28, width: 480, maxHeight: "85vh", overflowY: "auto",
      }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", fontFamily: "Georgia, serif", marginBottom: 20 }}>
          Edit expense
        </p>

        {/* Title */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Title</label>
          <input
            style={inputStyle}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = "#1a1a1a"}
            onBlur={(e) => e.target.style.borderColor = "#e8e6e0"}
          />
        </div>

        {/* Category + Date */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Category</label>
            <select
              style={inputStyle}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              style={inputStyle}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              onFocus={(e) => e.target.style.borderColor = "#1a1a1a"}
              onBlur={(e) => e.target.style.borderColor = "#e8e6e0"}
            />
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Notes <span style={{ color: "#ddd", textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
          <textarea
            style={{ ...inputStyle, resize: "none" }}
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = "#1a1a1a"}
            onBlur={(e) => e.target.style.borderColor = "#e8e6e0"}
          />
        </div>

        {/* Divider */}
        <div style={{ height: "0.5px", background: "#f0ede8", margin: "16px 0" }} />

        {/* Items */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Items</label>

          {/* Add item row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              style={{ ...inputStyle, flex: 2 }}
              placeholder="Item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              onFocus={(e) => e.target.style.borderColor = "#1a1a1a"}
              onBlur={(e) => e.target.style.borderColor = "#e8e6e0"}
            />
            <input
              type="number"
              style={{ ...inputStyle, flex: 1 }}
              placeholder="$0.00"
              value={itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              onFocus={(e) => e.target.style.borderColor = "#1a1a1a"}
              onBlur={(e) => e.target.style.borderColor = "#e8e6e0"}
            />
            <button
              onClick={addItem}
              style={{
                background: "#1a1a1a", color: "#faf9f7", border: "none",
                borderRadius: 8, padding: "0 14px", fontSize: 18,
                cursor: "pointer", flexShrink: 0,
              }}
            >+</button>
          </div>

          {/* Item list */}
          {items.length === 0 ? (
            <p style={{ fontSize: 12, color: "#ccc", textAlign: "center", padding: "10px 0" }}>No items</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#fff", border: "0.5px solid #e8e6e0", borderRadius: 8, padding: "7px 12px",
                }}>
                  <span style={{ fontSize: 13, color: "#1a1a1a" }}>{item.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", fontFamily: "Georgia, serif" }}>
                      ${item.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(i)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 16, padding: 0 }}
                      onMouseEnter={(e) => e.target.style.color = "#e55"}
                      onMouseLeave={(e) => e.target.style.color = "#ccc"}
                    >×</button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px 0", borderTop: "0.5px solid #f0ede8", marginTop: 4 }}>
                <span style={{ fontSize: 12, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", fontFamily: "Georgia, serif", letterSpacing: "-0.5px" }}>
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0", border: "0.5px solid #e8e6e0", borderRadius: 8,
              background: "#fff", fontSize: 13, color: "#888", fontFamily: "Georgia, serif", cursor: "pointer",
            }}
          >Cancel</button>
          <button
            onClick={handleSave}
            disabled={!form.title || items.length === 0}
            style={{
              flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
              background: !form.title || items.length === 0 ? "#e8e6e0" : "#1a1a1a",
              color: !form.title || items.length === 0 ? "#bbb" : "#faf9f7",
              fontSize: 13, fontWeight: 600, fontFamily: "Georgia, serif",
              cursor: !form.title || items.length === 0 ? "not-allowed" : "pointer",
            }}
          >Save changes</button>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseList({ expenses, onDelete, onEdit, onImport, categoryColors }) {
  const [expanded, setExpanded] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const fileRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingFile(file);
    setConfirm({
      type: "import",
      title: "Import CSV?",
      message: `This will import all expenses from "${file.name}" into Ledgr. Existing expenses will not be affected.`,
      confirmLabel: "Import",
    });
    e.target.value = "";
  };

  const handleImportConfirm = async () => {
    setConfirm(null);
    if (!pendingFile) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const text = await pendingFile.text();
      const rows = parseCSV(text);
      const count = await importExpensesFromCSV(rows);
      setImportMsg({ type: "success", text: `Successfully imported ${count} expense${count !== 1 ? "s" : ""}` });
      onImport();
    } catch (err) {
      setImportMsg({ type: "error", text: "Import failed — make sure it's a Ledgr CSV file" });
    } finally {
      setImporting(false);
      setPendingFile(null);
    }
  };

  const handleExportClick = () => {
    setConfirm({
      type: "export",
      title: "Export CSV?",
      message: `This will download all ${expenses.length} expense${expenses.length !== 1 ? "s" : ""} as a CSV file to your Downloads folder.`,
      confirmLabel: "Export",
    });
  };

  const handleConfirm = () => {
    if (confirm?.type === "export") { setConfirm(null); exportToCSV(expenses); }
    else if (confirm?.type === "import") { handleImportConfirm(); }
  };

  const buttonStyle = {
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 14px", background: "#fff", border: "0.5px solid #e8e6e0",
    borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#888",
    fontFamily: "Georgia, serif", transition: "all 0.15s ease",
  };

  const headerButtons = (
    <div style={{ display: "flex", gap: 8 }}>
      <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFileSelect} />
      <button
        style={buttonStyle}
        onClick={() => fileRef.current.click()}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.color = "#1a1a1a"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e6e0"; e.currentTarget.style.color = "#888"; }}
      >
        <Upload size={13} />
        {importing ? "Importing..." : "Import CSV"}
      </button>
      <button
        style={buttonStyle}
        onClick={handleExportClick}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.color = "#1a1a1a"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e6e0"; e.currentTarget.style.color = "#888"; }}
      >
        <Download size={13} />
        Export CSV
      </button>
    </div>
  );

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (expenses.length === 0) {
    return (
      <div>
        {confirm && <ConfirmModal {...confirm} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px" }}>Expenses</h1>
          {headerButtons}
        </div>
        {importMsg && (
          <div style={{
            padding: "10px 16px", borderRadius: 10, fontSize: 12, marginBottom: 20,
            background: importMsg.type === "success" ? "#f0faf4" : "#fdf2f2",
            color: importMsg.type === "success" ? "#2e7d52" : "#c0392b",
            border: `0.5px solid ${importMsg.type === "success" ? "#b6e8cc" : "#f5c0c0"}`,
          }}>{importMsg.text}</div>
        )}
        <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>💸</p>
          <p style={{ fontSize: 15, color: "#aaa", fontWeight: 600 }}>No expenses yet</p>
          <p style={{ fontSize: 13, marginTop: 6, color: "#ccc" }}>Add your first expense to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {confirm && <ConfirmModal {...confirm} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />}
      {editingExpense && (
        <EditModal
          expense={editingExpense}
          onSave={onEdit}
          onClose={() => setEditingExpense(null)}
        />
      )}

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
          {headerButtons}
        </div>
      </div>

      {importMsg && (
        <div style={{
          padding: "10px 16px", borderRadius: 10, fontSize: 12, marginBottom: 20,
          background: importMsg.type === "success" ? "#f0faf4" : "#fdf2f2",
          color: importMsg.type === "success" ? "#2e7d52" : "#c0392b",
          border: `0.5px solid ${importMsg.type === "success" ? "#b6e8cc" : "#f5c0c0"}`,
        }}>{importMsg.text}</div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {expenses.map((expense) => {
          const isExpanded = expanded === expense.id;
          return (
            <div
              key={expense.id}
              style={{
                background: "#fff", border: "0.5px solid #e8e6e0",
                borderRadius: 14, overflow: "hidden", transition: "border-color 0.15s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#c8c5be"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e8e6e0"}
            >
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 20px",
                  cursor: expense.items?.length > 0 ? "pointer" : "default",
                }}
                onClick={() => expense.items?.length > 0 && setExpanded(isExpanded ? null : expense.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: categoryColors[expense.category] || "#9a9a8a", flexShrink: 0,
                  }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>{expense.title}</p>
                    <p style={{ fontSize: 11, color: "#ccc" }}>{expense.category} · {expense.date}</p>
                    {expense.notes && <p style={{ fontSize: 11, color: "#ddd", marginTop: 2 }}>{expense.notes}</p>}
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
                    onClick={(e) => { e.stopPropagation(); setEditingExpense(expense); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer", color: "#ddd",
                      padding: 4, display: "flex", alignItems: "center", transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#1a1a1a"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#ddd"}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer", color: "#ddd",
                      padding: 4, display: "flex", alignItems: "center", transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#e55"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#ddd"}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {isExpanded && expense.items?.length > 0 && (
                <div style={{ borderTop: "0.5px solid #f0ede8", padding: "12px 20px 14px 42px" }}>
                  {expense.items.map((item, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", padding: "6px 0",
                      borderBottom: i < expense.items.length - 1 ? "0.5px solid #f8f6f2" : "none",
                    }}>
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