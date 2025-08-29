const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

/**
 * Internal helper to build request options
 */
function makeOptions(method = "GET", body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  return opts;
}

/**
 * Internal helper to parse JSON and normalize errors
 */
async function handle(res) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// PUBLIC_INTERFACE
export const AuthAPI = {
  /** Login with email + password */
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, makeOptions("POST", { email, password }));
    return handle(res);
  },
  /** Register a user */
  async register(payload) {
    const res = await fetch(`${API_BASE}/auth/register`, makeOptions("POST", payload));
    return handle(res);
  },
  /** Get current user profile */
  async me(token) {
    const res = await fetch(`${API_BASE}/auth/me`, makeOptions("GET", undefined, token));
    return handle(res);
  }
};
; // ensure file terminates with semicolon

// PUBLIC_INTERFACE
export const TripsAPI = {
  /** Fetch trips for current user */
  async list(token) {
    const res = await fetch(`${API_BASE}/trips`, makeOptions("GET", undefined, token));
    return handle(res);
  },
  /** Create new trip */
  async create(payload, token) {
    const res = await fetch(`${API_BASE}/trips`, makeOptions("POST", payload, token));
    return handle(res);
  },
  /** Update trip */
  async update(id, payload, token) {
    const res = await fetch(`${API_BASE}/trips/${id}`, makeOptions("PUT", payload, token));
    return handle(res);
  },
  /** Delete trip */
  async remove(id, token) {
    const res = await fetch(`${API_BASE}/trips/${id}`, makeOptions("DELETE", undefined, token));
    return handle(res);
  }
};

// PUBLIC_INTERFACE
export const BudgetsAPI = {
  /** Get or create budgets per trip */
  async getByTrip(tripId, token) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/budget`, makeOptions("GET", undefined, token));
    return handle(res);
  },
  async upsert(tripId, payload, token) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/budget`, makeOptions("PUT", payload, token));
    return handle(res);
  }
};

// PUBLIC_INTERFACE
export const ExpensesAPI = {
  /** List expenses for a trip */
  async list(tripId, token, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/trips/${tripId}/expenses${qs ? `?${qs}` : ""}`, makeOptions("GET", undefined, token));
    return handle(res);
  },
  /** Create expense */
  async create(tripId, payload, token) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/expenses`, makeOptions("POST", payload, token));
    return handle(res);
  },
  /** Update expense */
  async update(tripId, id, payload, token) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/expenses/${id}`, makeOptions("PUT", payload, token));
    return handle(res);
  },
  /** Delete expense */
  async remove(tripId, id, token) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/expenses/${id}`, makeOptions("DELETE", undefined, token));
    return handle(res);
  }
};

// PUBLIC_INTERFACE
export const ReportsAPI = {
  /** Get summary/statistics for a trip */
  async summary(tripId, token) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/reports/summary`, makeOptions("GET", undefined, token));
    return handle(res);
  }
};

// PUBLIC_INTERFACE
export const CurrencyAPI = {
  /** Convert amount between currencies */
  async convert(params) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/currency/convert?${qs}`, makeOptions("GET"));
    return handle(res);
  },
  /** Get a list of supported currencies */
  async list() {
    const res = await fetch(`${API_BASE}/currency`, makeOptions("GET"));
    return handle(res);
  }
};
```

Explanation: Add a currency utility for formatting and basic conversion helper.

````write file="travel-budget-planner-129330-129342/travel_budget_frontend/src/services/currency.js"
const DEFAULT_CCY = process.env.REACT_APP_DEFAULT_CURRENCY || "USD";

// PUBLIC_INTERFACE
export function formatMoney(amount, currency = DEFAULT_CCY) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

// PUBLIC_INTERFACE
export function sum(arr, selector = (x) => x) {
  return (arr || []).reduce((acc, x) => acc + Number(selector(x) || 0), 0);
}
```

Explanation: Add Auth context to store token and user, persisting to localStorage. Includes docstrings and PUBLIC_INTERFACE markers.

````write file="travel-budget-planner-129330-129342/travel_budget_frontend/src/context/AuthContext.js"
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthAPI } from "../services/api";

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * AuthProvider manages user session state, including JWT token and user profile.
   * It exposes login, register, logout, and a ready flag.
   */
  const [token, setToken] = useState(() => localStorage.getItem("tb_token") || "");
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setReady(true);
        return;
      }
      try {
        const me = await AuthAPI.me(token);
        setUser(me);
      } catch {
        setToken("");
        localStorage.removeItem("tb_token");
      } finally {
        setReady(true);
      }
    }
    bootstrap();
  }, [token]);

  // PUBLIC_INTERFACE
  async function login(email, password) {
    const { token: tkn, user: usr } = await AuthAPI.login(email, password);
    setToken(tkn);
    setUser(usr);
    localStorage.setItem("tb_token", tkn);
    return usr;
  }

  // PUBLIC_INTERFACE
  async function register(payload) {
    const res = await AuthAPI.register(payload);
    return res;
  }

  // PUBLIC_INTERFACE
  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("tb_token");
  }

  const value = useMemo(() => ({ token, user, ready, login, register, logout }), [token, user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access authentication context */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

Explanation: Add a lightweight reusable components library (Navbar is integrated in AppShell, but add shared UI components where needed).

````write file="travel-budget-planner-129330-129342/travel_budget_frontend/src/components/Loader.js"
import React from "react";

// PUBLIC_INTERFACE
export default function Loader({ label = "Loading..." }) {
  /** Minimal loader with accessible label */
  return (
    <div role="status" aria-live="polite" className="badge">
      ⏳ {label}
    </div>
  );
}
```

````write file="travel-budget-planner-129330-129342/travel_budget_frontend/src/components/ProtectedRoute.js"
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// PUBLIC_INTERFACE
export default function ProtectedRoute({ children }) {
  /** Wrap a route element to protect it behind authentication */
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

Explanation: Add Dashboard page with overview cards, latest expenses, and mini chart placeholder.

````write file="travel-budget-planner-129330-129342/travel_budget_frontend/src/pages/Dashboard.js"
import React, { useEffect, useMemo, useState } from "react";
import { TripsAPI, ExpensesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatMoney, sum } from "../services/currency";
import Loader from "../components/Loader";

// PUBLIC_INTERFACE
export default function Dashboard() {
  /** Dashboard shows quick stats, upcoming trips, and recent expenses */
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const t = await TripsAPI.list(token);
        setTrips(t || []);
        if ((t || []).length) {
          // load recent expenses from the first trip as a sample
          const firstTripId = t[0].id;
          const expenses = await ExpensesAPI.list(firstTripId, token, { limit: 5, sort: "-date" });
          setRecent(expenses || []);
        } else {
          setRecent([]);
        }
      } catch {
        setTrips([]);
        setRecent([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const totals = useMemo(() => {
    const totalBudget = sum(trips, x => x.budget?.total || 0);
    const totalSpent = sum(trips, x => x.budget?.spent || 0);
    const remaining = totalBudget - totalSpent;
    return { totalBudget, totalSpent, remaining };
  }, [trips]);

  if (loading) return <Loader label="Loading dashboard" />;

  return (
    <div className="grid">
      <section className="span-12 card">
        <div className="spread">
          <h3>Overview</h3>
          <div className="badge primary">Live</div>
        </div>
        <div className="grid" style={{marginTop: 8}}>
          <div className="span-4 card">
            <div className="subtitle">Total Budget</div>
            <div style={{fontSize: 22, fontWeight: 700}}>{formatMoney(totals.totalBudget)}</div>
          </div>
          <div className="span-4 card">
            <div className="subtitle">Total Spent</div>
            <div style={{fontSize: 22, fontWeight: 700}}>{formatMoney(totals.totalSpent)}</div>
          </div>
          <div className="span-4 card">
            <div className="subtitle">Remaining</div>
            <div style={{fontSize: 22, fontWeight: 700, color: totals.remaining >= 0 ? "var(--color-accent)" : "crimson)"}}>
              {formatMoney(totals.remaining)}
            </div>
          </div>
        </div>
      </section>

      <section className="span-6 card">
        <h3>Upcoming / Active Trips</h3>
        <div className="stack">
          {trips.length === 0 && <div className="subtitle">No trips yet. Create one in Trips.</div>}
          {trips.slice(0,5).map(trip => (
            <div key={trip.id} className="spread" style={{borderBottom: "1px solid var(--border)", paddingBottom: 8}}>
              <div>
                <strong>{trip.name}</strong>
                <div className="subtitle">{trip.destination} • {trip.startDate} → {trip.endDate}</div>
              </div>
              <div className="badge accent">
                {formatMoney(trip.budget?.spent || 0)} / {formatMoney(trip.budget?.total || 0)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="span-6 card">
        <h3>Recent Expenses</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Category</th><th>Note</th><th style={{textAlign: "right"}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(item => (
              <tr key={item.id}>
                <td>{item.date}</td>
                <td><span className="badge">{item.category}</span></td>
                <td>{item.note || "-"}</td>
                <td style={{textAlign: "right"}}>{formatMoney(item.amount, item.currency)}</td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={4} className="subtitle">No recent expenses</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="span-12 card">
        <h3>Spending trend</h3>
        <div className="chart">Chart will render from backend data</div>
      </section>
    </div>
  );
}
```

Explanation: Add Trips page with list, create/update form, and budget editor integration.

````write file="travel-budget-planner-129330-129342/travel_budget_frontend/src/pages/Trips.js"
import React, { useEffect, useState } from "react";
import { TripsAPI, BudgetsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../services/currency";
import Loader from "../components/Loader";

const emptyTrip = { name: "", destination: "", startDate: "", endDate: "" };
const emptyBudget = { total: 0, categories: { accommodation: 0, food: 0, transport: 0, activities: 0, misc: 0 } };

// PUBLIC_INTERFACE
export default function Trips() {
  /** Manage trips and budgets (create, update, delete, and per-category budget) */
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTrip);
  const [budgetForm, setBudgetForm] = useState(emptyBudget);

  async function load() {
    setLoading(true);
    try {
      const list = await TripsAPI.list(token);
      setItems(list || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  function onChange(e) {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  }

  function onBudgetChange(e) {
    const { name, value } = e.target;
    if (name === "total") return setBudgetForm(s => ({ ...s, total: Number(value || 0) }));
    setBudgetForm(s => ({ ...s, categories: { ...s.categories, [name]: Number(value || 0) } }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (editing) {
      await TripsAPI.update(editing.id, form, token);
    } else {
      await TripsAPI.create(form, token);
    }
    setForm(emptyTrip);
    setEditing(null);
    load();
  }

  async function onDelete(it) {
    if (!window.confirm(`Delete trip "${it.name}"?`)) return;
    await TripsAPI.remove(it.id, token);
    if (editing?.id === it.id) { setEditing(null); setForm(emptyTrip); }
    load();
  }

  async function onEdit(it) {
    setEditing(it);
    setForm({
      name: it.name,
      destination: it.destination || "",
      startDate: it.startDate || "",
      endDate: it.endDate || ""
    });
    try {
      const b = await BudgetsAPI.getByTrip(it.id, token);
      setBudgetForm({
        total: b?.total || 0,
        categories: { accommodation:0, food:0, transport:0, activities:0, misc:0, ...(b?.categories||{}) }
      });
    } catch {
      setBudgetForm(emptyBudget);
    }
  }

  async function onBudgetSave() {
    if (!editing) return;
    await BudgetsAPI.upsert(editing.id, budgetForm, token);
    load();
  }

  if (loading) return <Loader label="Loading trips" />;

  return (
    <div className="grid">
      <section className="span-6 card">
        <div className="spread">
          <h3>{editing ? "Edit Trip" : "Create Trip"}</h3>
          {editing && <button className="btn" onClick={() => { setEditing(null); setForm(emptyTrip); }}>Cancel</button>}
        </div>
        <form className="stack" onSubmit={onSubmit}>
          <input className="input" name="name" placeholder="Trip name" value={form.name} onChange={onChange} required />
          <div className="input-row">
            <div className="col-6">
              <input className="input" name="destination" placeholder="Destination" value={form.destination} onChange={onChange} />
            </div>
            <div className="col-3">
              <input className="input" name="startDate" type="date" value={form.startDate} onChange={onChange} />
            </div>
            <div className="col-3">
              <input className="input" name="endDate" type="date" value={form.endDate} onChange={onChange} />
            </div>
          </div>
          <button className="btn primary" type="submit">{editing ? "Save changes" : "Create trip"}</button>
        </form>
      </section>

      <section className="span-6 card">
        <h3>Budget</h3>
        <div className="input-row" style={{marginBottom: 10}}>
          <div className="col-4">
            <label className="subtitle">Total</label>
            <input className="input" name="total" type="number" value={budgetForm.total} onChange={onBudgetChange} />
          </div>
          {["accommodation","food","transport","activities","misc"].map(cat => (
            <div key={cat} className="col-4">
              <label className="subtitle" style={{textTransform:"capitalize"}}>{cat}</label>
              <input className="input" name={cat} type="number" value={budgetForm.categories[cat] || 0} onChange={onBudgetChange} />
            </div>
          ))}
        </div>
        <button className="btn accent" onClick={onBudgetSave} disabled={!editing}>Save budget for selected trip</button>
        {!editing && <div className="subtitle" style={{marginTop: 8}}>Select a trip to edit its budget.</div>}
      </section>

      <section className="span-12 card">
        <h3>My Trips</h3>
        <table className="table">
          <thead>
          <tr>
            <th>Trip</th><th>Dates</th><th>Destination</th><th>Budget</th><th>Actions</th>
          </tr>
          </thead>
          <tbody>
          {items.map(it => (
            <tr key={it.id}>
              <td><strong>{it.name}</strong></td>
              <td className="subtitle">{it.startDate || "-"} → {it.endDate || "-"}</td>
              <td>{it.destination || "-"}</td>
              <td>
                <span className="badge accent">{formatMoney(it.budget?.spent || 0)} / {formatMoney(it.budget?.total || 0)}</span>
              </td>
              <td>
                <div className="spread" style={{gap: 8}}>
                  <button className="btn" onClick={() => onEdit(it)}>Edit</button>
                  <button className="btn warning" onClick={() => onDelete(it)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={5} className="subtitle">No trips yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

Explanation: Add Expenses page with categorization, currency conversion UI, and CRUD.

````write file="travel-budget-planner-129330-129342/travel_budget_frontend/src/pages/Expenses.js"
import React, { useEffect, useState } from "react";
import { TripsAPI, ExpensesAPI, CurrencyAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatMoney, sum } from "../services/currency";
import Loader from "../components/Loader";

const cats = ["accommodation","food","transport","activities","misc"];
const emptyExpense = { tripId: "", date: "", category: "food", amount: "", currency: process.env.REACT_APP_DEFAULT_CURRENCY || "USD", note: "" };

// PUBLIC_INTERFACE
export default function Expenses() {
  /** Track expenses with categorization and currency conversion */
  const { token } = useAuth();
  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyExpense);
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState(["USD","EUR","GBP","JPY"]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const ts = await TripsAPI.list(token);
        setTrips(ts || []);
        if ((ts || []).length) {
          const first = ts[0].id;
          setTripId(first);
          setForm(s => ({ ...s, tripId: first }));
          const list = await ExpensesAPI.list(first, token, { sort: "-date" });
          setItems(list || []);
        }
        try {
          const c = await CurrencyAPI.list();
          if (Array.isArray(c) && c.length) setCurrencies(c);
        } catch {}
      } catch {
        setTrips([]);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token]);

  async function reload(tid) {
    const list = await ExpensesAPI.list(tid, token, { sort: "-date" });
    setItems(list || []);
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.tripId) return;
    await ExpensesAPI.create(form.tripId, {
      date: form.date,
      category: form.category,
      amount: Number(form.amount || 0),
      currency: form.currency,
      note: form.note
    }, token);
    setForm(s => ({ ...emptyExpense, tripId: s.tripId }));
    reload(form.tripId);
  }

  async function onDelete(it) {
    if (!window.confirm("Delete this expense?")) return;
    await ExpensesAPI.remove(it.tripId || tripId, it.id, token);
    reload(it.tripId || tripId);
  }

  async function convertPreview() {
    // optional helper to show conversion to default currency
    try {
      const res = await CurrencyAPI.convert({ amount: form.amount, from: form.currency, to: process.env.REACT_APP_DEFAULT_CURRENCY || "USD" });
      alert(`${formatMoney(form.amount, form.currency)} ≈ ${formatMoney(res?.amount, res?.currency)}`);
    } catch (e) {
      alert("Conversion failed. Ensure backend currency API is configured.");
    }
  }

  if (loading) return <Loader label="Loading expenses" />;

  const totalsByCat = cats.map(c => ({ cat: c, total: sum(items.filter(x => x.category === c), x => x.amount) }));
  const grand = sum(items, x => x.amount);

  return (
    <div className="grid">
      <section className="span-12 card">
        <div className="input-row">
          <div className="col-6">
            <label className="subtitle">Trip</label>
            <select className="select" value={tripId} onChange={(e) => { setTripId(e.target.value); setForm(s => ({ ...s, tripId: e.target.value })); reload(e.target.value); }}>
              {trips.map(t => <option key={t.id} value={t.id}>{t.name} — {t.destination}</option>)}
            </select>
          </div>
          <div className="col-6 spread" style={{alignItems:"end"}}>
            <div className="badge primary">Total: {formatMoney(grand)}</div>
          </div>
        </div>
      </section>

      <section className="span-5 card">
        <h3>Add Expense</h3>
        <form className="stack" onSubmit={onSubmit}>
          <div className="input-row">
            <div className="col-6"><input className="input" type="date" name="date" value={form.date} onChange={onChange} required /></div>
            <div className="col-6">
              <select className="select" name="category" value={form.category} onChange={onChange}>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="input-row">
            <div className="col-6"><input className="input" name="amount" type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={onChange} required /></div>
            <div className="col-6">
              <select className="select" name="currency" value={form.currency} onChange={onChange}>
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <input className="input" name="note" placeholder="Note (optional)" value={form.note} onChange={onChange} />
          <div className="spread">
            <button className="btn" type="button" onClick={convertPreview}>Convert preview</button>
            <button className="btn primary" type="submit">Add</button>
          </div>
        </form>
      </section>

      <section className="span-7 card">
        <h3>Spending by category</h3>
        <table className="table">
          <thead><tr><th>Category</th><th style={{textAlign:"right"}}>Total</th></tr></thead>
          <tbody>
          {totalsByCat.map(row => (
            <tr key={row.cat}>
              <td style={{textTransform:"capitalize"}}>{row.cat}</td>
              <td style={{textAlign:"right"}}>{formatMoney(row.total)}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </section>

      <section className="span-12 card">
        <h3>All Expenses</h3>
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Category</th><th>Note</th><th>Currency</th><th style={{textAlign:"right"}}>Amount</th><th>Actions</th></tr>
          </thead>
          <tbody>
          {items.map(it => (
            <tr key={it.id}>
              <td>{it.date}</td>
              <td><span className="badge">{it.category}</span></td>
              <td>{it.note || "-"}</td>
              <td>{it.currency}</td>
              <td style={{textAlign:"right"}}>{formatMoney(it.amount, it.currency)}</td>
              <td><button className="btn warning" onClick={() => onDelete(it)}>Delete</button></td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={6} className="subtitle">No expenses for this trip yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

Explanation: Add Reports page with insights and recommendations, using backend summary endpoint and simple visual blocks.

````write file="travel-budget-planner-129330-129342/travel_budget_frontend/src/pages/Reports.js"
import React, { useEffect, useState } from "react";
import { TripsAPI, ReportsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../services/currency";
import Loader from "../components/Loader";

// PUBLIC_INTERFACE
export default function Reports() {
  /** Visualize spending insights and recommendations based on backend summary */
  const { token } = useAuth();
  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const t = await TripsAPI.list(token);
        setTrips(t || []);
        const first = (t || [])[0]?.id || "";
        setTripId(first);
        if (first) {
          const s = await ReportsAPI.summary(first, token);
          setSummary(s || {});
        }
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token]);

  async function reload(id) {
    setLoading(true);
    try {
      const s = await ReportsAPI.summary(id, token);
      setSummary(s || {});
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loader label="Loading reports" />;

  return (
    <div className="grid">
      <section className="span-12 card">
        <div className="input-row">
          <div className="col-6">
            <label className="subtitle">Trip</label>
            <select className="select" value={tripId} onChange={(e)=> { setTripId(e.target.value); reload(e.target.value); }}>
              {trips.map(t => <option value={t.id} key={t.id}>{t.name} — {t.destination}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="span-4 card">
        <h3>Summary</h3>
        <div className="stack">
          <div className="badge primary">Budget: {formatMoney(summary?.budget || 0)}</div>
          <div className="badge accent">Spent: {formatMoney(summary?.spent || 0)}</div>
          <div className="badge">{summary?.currency || (process.env.REACT_APP_DEFAULT_CURRENCY || "USD")}</div>
        </div>
      </section>

      <section className="span-8 card">
        <h3>Category breakdown</h3>
        <div className="grid">
          {(summary?.byCategory || []).map((row) => (
            <div key={row.category} className="span-4 card">
              <div className="subtitle" style={{textTransform:"capitalize"}}>{row.category}</div>
              <div style={{fontWeight:700}}>{formatMoney(row.total)}</div>
              <div className="badge">{Math.round(row.percent || 0)}%</div>
            </div>
          ))}
          {(!summary?.byCategory || summary.byCategory.length === 0) && <div className="span-12 subtitle">No category data</div>}
        </div>
      </section>

      <section className="span-12 card">
        <h3>Recommendations</h3>
        <div className="stack">
          {(summary?.recommendations || [
            "Shift more budget to categories overspending by >10%.",
            "Track small daily purchases—they add up quickly.",
            "Use local currency where possible to avoid conversion fees."
          ]).map((r, i) => (
            <div key={i} className="badge">{r}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

Explanation: Add Settings page to manage theme note and show API env, plus placeholder for profile info.

````write file="travel-budget-planner-129330-129342/travel_budget_frontend/src/pages/Settings.js"
import React from "react";

// PUBLIC_INTERFACE
export default function Settings() {
  /** Settings page for environment info and simple preferences */
  return (
    <div className="grid">
      <section className="span-6 card">
        <h3>Environment</h3>
        <div className="stack">
          <div className="badge">API Base: {process.env.REACT_APP_API_BASE_URL || "Not set"}</div>
          <div className="badge">Default Currency: {process.env.REACT_APP_DEFAULT_CURRENCY || "USD"}</div>
          <div className="subtitle">Theme can be toggled from the sidebar.</div>
        </div>
      </section>

      <section className="span-6 card">
        <h3>Profile</h3>
        <div className="subtitle">Profile editing can be implemented here as needed.</div>
      </section>
    </div>
  );
}
```

Explanation: Add Auth pages for login and registration with PUBLIC_INTERFACE docstrings.

````write file="travel-budget-planner-129330-129342/travel_budget_frontend/src/pages/auth/Login.js"
import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// PUBLIC_INTERFACE
export default function Login() {
  /** Sign-in page using email and password */
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  function onChange(e) {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      nav("/");
    } catch (err) {
      setError(err?.message || "Login failed");
    }
  }

  return (
    <div className="auth-wrapper card">
      <div className="auth-header">
        <h2>Welcome back</h2>
        <div className="subtitle">Sign in to continue</div>
      </div>
      {error && <div className="badge warning" role="alert">{error}</div>}
      <form className="stack" onSubmit={onSubmit}>
        <input className="input" type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input className="input" type="password" name="password" placeholder="Password" value={form.password} onChange={onChange} required />
        <button className="btn primary" type="submit">Sign in</button>
      </form>
      <div className="subtitle" style={{marginTop: 12}}>
        New here? <NavLink to="/register">Create an account</NavLink>
      </div>
    </div>
  );
}
```

````write file="travel-budget-planner-129330-129342/travel_budget_frontend/src/pages/auth/Register.js"
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// PUBLIC_INTERFACE
export default function Register() {
  /** Registration page with name, email, and password fields */
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  function onChange(e) {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setOk("");
    try {
      await register(form);
      setOk("Registration successful. You can now sign in.");
      setTimeout(() => nav("/login"), 900);
    } catch (err) {
      setError(err?.message || "Registration failed");
    }
  }

  return (
    <div className="auth-wrapper card">
      <div className="auth-header">
        <h2>Create account</h2>
        <div className="subtitle">Plan, track, and optimize your trips</div>
      </div>
      {error && <div className="badge warning" role="alert">{error}</div>}
      {ok && <div className="badge accent" role="status">{ok}</div>}
      <form className="stack" onSubmit={onSubmit}>
        <input className="input" name="name" placeholder="Full name" value={form.name} onChange={onChange} required />
        <input className="input" type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input className="input" type="password" name="password" placeholder="Password" value={form.password} onChange={onChange} required />
        <button className="btn primary" type="submit">Create account</button>
      </form>
      <div className="subtitle" style={{marginTop: 12}}>
        Already have an account? <NavLink to="/login">Sign in</NavLink>
      </div>
    </div>
  );
}
```

Explanation: Update index.css to complement new design baseline.

````edit file="travel-budget-planner-129330-129342/travel_budget_frontend/src/index.css"
<<<<<<< SEARCH
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
=======
:root {
  color-scheme: light dark;
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
>>>>>>> REPLACE
