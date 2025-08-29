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
      const fromStr = formatMoney(form.amount, form.currency);
      const toStr = formatMoney(res && res.amount, res && res.currency);
      window.alert(fromStr + " ≈ " + toStr);
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
