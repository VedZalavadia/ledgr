let Database;

async function loadDatabase() {
  if (!Database) {
    const mod = await import("@tauri-apps/plugin-sql");
    Database = mod.default;
  }
  return Database;
}

let db = null;

export async function getDb() {
  const DB = await loadDatabase();
  if (db) return db;
  db = await DB.load("sqlite:ledgr.db");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
    )
  `);
  return db;
}

export async function fetchExpenses() {
  const db = await getDb();
  const expenses = await db.select("SELECT * FROM expenses ORDER BY id DESC");
  const items = await db.select("SELECT * FROM items");
  return expenses.map((e) => ({
    ...e,
    items: items.filter((i) => i.expense_id === e.id),
  }));
}

export async function insertExpense(expense, items) {
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO expenses (title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?)",
    [expense.title, expense.amount, expense.category, expense.date, expense.notes || ""]
  );
  const expenseId = result.lastInsertId;
  for (const item of items) {
    await db.execute(
      "INSERT INTO items (expense_id, name, amount) VALUES (?, ?, ?)",
      [expenseId, item.name, item.amount]
    );
  }
}

export async function updateExpense(expense, items) {
  const db = await getDb();
  await db.execute(
    "UPDATE expenses SET title=?, amount=?, category=?, date=?, notes=? WHERE id=?",
    [expense.title, expense.amount, expense.category, expense.date, expense.notes || "", expense.id]
  );
  await db.execute("DELETE FROM items WHERE expense_id=?", [expense.id]);
  for (const item of items) {
    await db.execute(
      "INSERT INTO items (expense_id, name, amount) VALUES (?, ?, ?)",
      [expense.id, item.name, item.amount]
    );
  }
}

export async function removeExpense(id) {
  const db = await getDb();
  await db.execute("DELETE FROM items WHERE expense_id = ?", [id]);
  await db.execute("DELETE FROM expenses WHERE id = ?", [id]);
}

export async function importExpensesFromCSV(rows) {
  const db = await getDb();
  const expenses = [];
  let current = null;

  for (const row of rows) {
    const [title, category, date, total, itemName, itemAmount, notes] = row;
    if (title) {
      current = {
        title, category, date,
        amount: parseFloat(total) || 0,
        notes: notes || "",
        items: [],
      };
      expenses.push(current);
    }
    if (current && itemName) {
      current.items.push({ name: itemName, amount: parseFloat(itemAmount) || 0 });
    }
  }

  for (const expense of expenses) {
    const result = await db.execute(
      "INSERT INTO expenses (title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?)",
      [expense.title, expense.amount, expense.category, expense.date, expense.notes]
    );
    const expenseId = result.lastInsertId;
    for (const item of expense.items) {
      await db.execute(
        "INSERT INTO items (expense_id, name, amount) VALUES (?, ?, ?)",
        [expenseId, item.name, item.amount]
      );
    }
  }

  return expenses.length;
}