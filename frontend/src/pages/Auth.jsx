
import { useState } from "react";
import axios from "axios";

import "./Auth.css";

const API = "http://localhost:5000/api/auth";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(`${API}/login`, {
          email,
          password
        });
console.log("Login response keys:", Object.keys(response.data));
console.log("Token received:", Boolean(response.data.token));
        localStorage.setItem("hotelproToken", response.data.token);
        localStorage.setItem(
          "hotelproUser",
          JSON.stringify(response.data.user)
        );

        setMessage("Login successful!");

        // Return to the hotel homepage
        window.location.href = "/";
      } else {
        const response = await axios.post(`${API}/register`, {
          name,
          email,
          password
        });

        setMessage(response.data.message);
        setIsLogin(true);
        setName("");
        setPassword("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <a className="auth-brand" href="/">
          HotelPro
        </a>

        <p className="auth-eyebrow">YOUR PERFECT STAY</p>

        <h1>{isLogin ? "Welcome Back" : "Create Your Account"}</h1>

        <p className="auth-subtitle">
          {isLogin
            ? "Sign in to continue your hotel experience."
            : "Join HotelPro and plan your next stay."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? "selected" : ""}
            onClick={() => {
              setIsLogin(true);
              setError("");
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={!isLogin ? "selected" : ""}
            onClick={() => {
              setIsLogin(false);
              setError("");
              setMessage("");
            }}
          >
            Register
          </button>
        </div>

        {error && <div className="auth-alert error">{error}</div>}
        {message && <div className="auth-alert success">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <label>
              Full Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
          </label>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isLogin
                ? "Login"
                : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          {isLogin ? "New to HotelPro?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setMessage("");
            }}
          >
            {isLogin ? "Register here" : "Login here"}
          </button>
        </p>

        <a href="/" className="back-home">
          ← Back to homepage
        </a>
      </div>
    </div>
  );
}
