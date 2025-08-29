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
