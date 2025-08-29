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
            <div style={{fontSize: 22, fontWeight: 700, color: totals.remaining >= 0 ? "var(--color-accent)" : "crimson"}}>
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
