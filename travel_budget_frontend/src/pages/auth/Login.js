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
