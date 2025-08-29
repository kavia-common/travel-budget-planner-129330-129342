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
