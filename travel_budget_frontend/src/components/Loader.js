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
