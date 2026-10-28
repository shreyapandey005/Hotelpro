import { useEffect, useState } from "react";
import axios from "axios";
import "./Bookings.css";

const API = "http://localhost:5000/api";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const token = localStorage.getItem("hotelproToken");
    if (!token) { window.location.href = "/login"; return; }
    try {
      setError("");
      const response = await axios.get(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load bookings. Admin access is required.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    try {
      const token = localStorage.getItem("hotelproToken");
      const response = await axios.patch(`${API}/bookings/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotice(response.data.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update booking.");
    }
  }

  return (
    <main className="bookings-page">
      <nav className="bookings-nav"><a className="brand" href="/">HotelPro<span>.</span></a><div><a href="/admin">Rooms dashboard</a><a href="/">View website</a></div></nav>
      <section className="bookings-content">
        <p className="eyebrow">HOTEL MANAGEMENT</p><h1>Manage Bookings</h1>
        <p className="bookings-subtitle">Review reservations and update their status.</p>
        {notice && <p className="bookings-notice">{notice}</p>}
        {error && <p className="bookings-error">{error}</p>}
        {loading ? <p>Loading bookings...</p> : bookings.length === 0 ? <p>No bookings have been made yet.</p> : (
          <div className="admin-booking-list">
            {bookings.map((b) => (
              <article className="booking-record" key={b._id}>
                <div className="booking-record-head"><div><p className="eyebrow">REFERENCE</p><strong>{b._id}</strong></div><span className={`status-pill status-${b.status}`}>{b.status}</span></div>
                <h2>{b.roomName}</h2>
                <div className="booking-record-grid">
                  <div><span>Guest</span><strong>{b.guestName}</strong></div>
                  <div><span>Email</span><strong>{b.guestEmail}</strong></div>
                  <div><span>Check-in</span><strong>{new Date(b.checkIn).toLocaleDateString("en-IN", { timeZone: "UTC" })}</strong></div>
                  <div><span>Check-out</span><strong>{new Date(b.checkOut).toLocaleDateString("en-IN", { timeZone: "UTC" })}</strong></div>
                  <div><span>Guests / nights</span><strong>{b.guests} / {b.nights}</strong></div>
                  <div><span>Total</span><strong>₹{Number(b.totalPrice).toLocaleString("en-IN")}</strong></div>
                </div>
                <label className="status-editor">Update status
                  <select value={b.status} onChange={(e) => updateStatus(b._id, e.target.value)}>
                    {["pending", "confirmed", "cancelled", "checked-in", "checked-out"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
