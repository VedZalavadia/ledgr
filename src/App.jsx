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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    loadExpenses();
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

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

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "ti-layout-dashboard" },
    { key: "add", label: "Add expense", icon: "ti-plus" },
    { key: "expenses", label: "Expenses", icon: "ti-list" },
  ];

  const handleNavClick = (key) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#faf9f7", fontFamily: "Georgia, serif" }}>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(26,26,26,0.4)",
            zIndex: 200, transition: "opacity 0.2s ease",
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? 220 : isTablet ? 180 : 210,
        flexShrink: 0,
        background: "#fff",
        borderRight: "0.5px solid #e8e6e0",
        padding: "28px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        position: isMobile ? "fixed" : "sticky",
        top: 0,
        left: isMobile ? (sidebarOpen ? 0 : -240) : 0,
        height: "100vh",
        zIndex: isMobile ? 300 : 1,
        transition: "left 0.25s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", padding: "0 4px", letterSpacing: "-0.5px" }}>ledgr</span>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 18, padding: 4 }}
            >×</button>
          )}
        </div>

        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNavClick(item.key)}
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

      {/* Main */}
      <main style={{
        flex: 1,
        padding: isMobile ? "20px 16px" : isTablet ? "28px 24px" : "36px 40px",
        minWidth: 0,
        width: "100%",
      }}>

        {/* Mobile header */}
        {isMobile && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px" }}>ledgr</span>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "0.5px solid #e8e6e0", borderRadius: 8, cursor: "pointer", padding: "6px 10px", color: "#888" }}
            >
              <i className="ti ti-menu-2" style={{ fontSize: 16 }} aria-hidden="true" />
            </button>
          </div>
        )}

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