import { useState, useEffect, useRef } from "react";

const CATEGORIES = ["Groceries", "Dining", "Transport", "Entertainment", "Shopping", "Other"];

const inputStyle = {
  width: "100%",
  background: "#fff",
  border: "0.5px solid #e8e6e0",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  color: "#1a1a1a",
  fontFamily: "Georgia, serif",
  outline: "none",
  transition: "border-color 0.15s ease",
};

const labelStyle = {
  fontSize: 11,
  color: "#bbb",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
  display: "block",
};

export default function ExpenseForm({ onAdd, onDone, expenses = [] }) {
  const [form, setForm] = useState({
    title: "",
    category: "Groceries",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Build a unique list of all past item names
  const allPastItems = [...new Set(
    expenses.flatMap((e) => (e.items || []).map((i) => i.name.toLowerCase()))
  )];

  // Filter suggestions as user types
  useEffect(() => {
    if (itemName.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    const matches = allPastItems.filter((name) =>
      name.includes(itemName.toLowerCase()) && name !== itemName.toLowerCase()
    );
    setSuggestions(matches.slice(0, 6));
  }, [itemName]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const pickSuggestion = (name) => {
    setItemName(name.charAt(0).toUpperCase() + name.slice(1));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const addItem = () => {
    if (!itemName || !itemAmount) return;
    setItems([...items, { name: itemName, amount: parseFloat(itemAmount) }]);
    setItemName("");
    setItemAmount("");
    setSuggestions([]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, i) => sum + i.amount, 0);

  const handleSubmit = () => {
    if (!form.title || items.length === 0) return;
    onAdd({ ...form, amount: total }, items);
    setForm({
      title: "",
      category: "Groceries",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setItems([]);
    onDone();
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px", marginBottom: 28 }}>
        New expense
      </h1>

      <div style={{
        background: "#fff",
        border: "0.5px solid #e8e6e0",
        borderRadius: 16,
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>

        {/* Title */}
        <div>
          <label style={labelStyle}>Title</label>
          <input
            style={inputStyle}
            placeholder="e.g. Weekly groceries"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = "#1a1a1a"}
            onBlur={(e) => e.target.style.borderColor = "#e8e6e0"}
          />
        </div>

        {/* Category */}
        <div>
          <label style={labelStyle}>Category</label>
          <select
            style={inputStyle}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Date */}
        <div>
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

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notes <span style={{ color: "#ddd", textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
          <textarea
            style={{ ...inputStyle, resize: "none" }}
            placeholder="Any extra details..."
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            onFocus={(e) => e.target.style.borderColor = "#1a1a1a"}
            onBlur={(e) => e.target.style.borderColor = "#e8e6e0"}
          />
        </div>

        {/* Divider */}
        <div style={{ height: "0.5px", background: "#f0ede8" }} />

        {/* Line Items */}
        <div>
          <label style={labelStyle}>Items</label>

          {/* Item Input Row */}
          <div style={{ position: "relative" }} ref={suggestionsRef}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 2, position: "relative" }}>
                <input
                  style={{ ...inputStyle }}
                  placeholder="Item name"
                  value={itemName}
                  onChange={(e) => { setItemName(e.target.value); setShowSuggestions(true); }}
                  onFocus={(e) => { e.target.style.borderColor = "#1a1a1a"; setShowSuggestions(true); }}
                  onBlur={(e) => e.target.style.borderColor = "#e8e6e0"}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "0.5px solid #e8e6e0",
                    borderRadius: 10,
                    zIndex: 100,
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  }}>
                    {suggestions.map((s, i) => (
                      <div
                        key={s}
                        onMouseDown={() => pickSuggestion(s)}
                        style={{
                          padding: "9px 14px",
                          fontSize: 13,
                          color: "#1a1a1a",
                          cursor: "pointer",
                          textTransform: "capitalize",
                          borderBottom: i < suggestions.length - 1 ? "0.5px solid #f0ede8" : "none",
                          background: "#fff",
                          transition: "background 0.1s ease",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#faf9f7"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="number"
                style={{ ...inputStyle, flex: 1 }}
                placeholder="$0.00"
                value={itemAmount}
                onChange={(e) => setItemAmount(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = "#1a1a1a"}
                onBlur={(e) => e.target.style.borderColor = "#e8e6e0"}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
              <button
                onClick={addItem}
                style={{
                  background: "#1a1a1a",
                  color: "#faf9f7",
                  border: "none",
                  borderRadius: 10,
                  padding: "0 16px",
                  fontSize: 18,
                  cursor: "pointer",
                  fontFamily: "Georgia, serif",
                  transition: "opacity 0.15s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => e.target.style.opacity = 0.8}
                onMouseLeave={(e) => e.target.style.opacity = 1}
              >
                +
              </button>
            </div>
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <p style={{ fontSize: 12, color: "#ccc", textAlign: "center", padding: "12px 0" }}>
              No items added yet — type a name and amount above
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#faf9f7",
                    border: "0.5px solid #e8e6e0",
                    borderRadius: 8,
                    padding: "8px 12px",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#1a1a1a" }}>{item.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", fontFamily: "Georgia, serif" }}>
                      ${item.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(i)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ccc",
                        fontSize: 16,
                        lineHeight: 1,
                        padding: 0,
                        transition: "color 0.15s ease",
                      }}
                      onMouseEnter={(e) => e.target.style.color = "#e55"}
                      onMouseLeave={(e) => e.target.style.color = "#ccc"}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 12px 0",
                borderTop: "0.5px solid #f0ede8",
                marginTop: 4,
              }}>
                <span style={{ fontSize: 12, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", fontFamily: "Georgia, serif", letterSpacing: "-0.5px" }}>
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!form.title || items.length === 0}
          style={{
            width: "100%",
            background: !form.title || items.length === 0 ? "#e8e6e0" : "#1a1a1a",
            color: !form.title || items.length === 0 ? "#bbb" : "#faf9f7",
            border: "none",
            borderRadius: 10,
            padding: "12px 0",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "Georgia, serif",
            cursor: !form.title || items.length === 0 ? "not-allowed" : "pointer",
            marginTop: 4,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { if (form.title && items.length > 0) e.target.style.opacity = 0.8; }}
          onMouseLeave={(e) => e.target.style.opacity = 1}
        >
          Add expense
        </button>
      </div>
    </div>
  );
}