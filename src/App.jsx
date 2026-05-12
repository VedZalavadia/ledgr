import { useState, useEffect } from "react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import Dashboard from "./components/Dashboard";
import { fetchExpenses, insertExpense, removeExpense, updateExpense } from "./db";

const CATEGORY_COLORS = {
  Groceries: "#cc2936",
  Dining: "#4db6ac",
  Transport: "#f4c842",
  Entertainment: "#1a3a5c",
  Shopping: "#e8799a",
  Other: "#9a9a8a",
};

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense, items) => {
    try {
      await insertExpense(expense, items);
      await loadExpenses();
    } catch (err) {
      console.error("Failed to add expense:", err);
    }
  };

  const editExpense = async (expense, items) => {
    try {
      await updateExpense(expense, items);
      await loadExpenses();
    } catch (err) {
      console.error("Failed to edit expense:", err);
    }
  };

  const deleteExpense = async (id) => {
    try {
      await removeExpense(id);
      await loadExpenses();
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#faf9f7", fontFamily: "'Georgia', serif" }}>

      {/* Sidebar */}
      <aside style={{
        width: 210, flexShrink: 0, background: "#fff",
        borderRight: "0.5px solid #e8e6e0", padding: "28px 16px",
        display: "flex", flexDirection: "column", gap: 4,
        position: "sticky", top: 0, height: "100vh",
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", padding: "0 10px", marginBottom: 28, letterSpacing: "-0.5px" }}>
          ledgr
        </div>

        {[
          { key: "dashboard", label: "Dashboard", icon: "ti-layout-dashboard" },
          { key: "add", label: "Add expense", icon: "ti-plus" },
          { key: "expenses", label: "Expenses", icon: "ti-list" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 8, border: "none",
              cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif",
              fontWeight: activeTab === item.key ? 600 : 400,
              background: activeTab === item.key ? "#f5f4f0" : "transparent",
              color: activeTab === item.key ? "#1a1a1a" : "#999",
              textAlign: "left", transition: "all 0.15s ease", width: "100%",
            }}
          >
            <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "36px 40px", maxWidth: 860 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb", fontSize: 13 }}>Loading...</div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <Dashboard expenses={expenses} categoryColors={CATEGORY_COLORS} />
            )}
            {activeTab === "add" && (
              <ExpenseForm onAdd={addExpense} onDone={() => setActiveTab("expenses")} expenses={expenses} />
            )}
            {activeTab === "expenses" && (
              <ExpenseList
                expenses={expenses}
                onDelete={deleteExpense}
                onEdit={editExpense}
                onImport={loadExpenses}
                categoryColors={CATEGORY_COLORS}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}