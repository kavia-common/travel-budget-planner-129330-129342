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
