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
