import { useEffect, useState } from "react";
import axios from "axios";
import "./Bookings.css";

const API = "http://localhost:5000/api";

function dateLabel(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
  });
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadBookings() {
    const token = localStorage.getItem("hotelproToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    try {
      setError("");
      const response = await axios.get(`${API}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load bookings. Please log in again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBookings(); }, []);

  async function cancelBooking(booking) {
    if (!window.confirm(`Cancel the booking for ${booking.roomName}?`)) return;
    try {
      const token = localStorage.getItem("hotelproToken");
      const response = await axios.patch(`${API}/bookings/${booking._id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotice(response.data.message);
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel this booking.");
    }
  }

  return (
    <main className="bookings-page">
      <nav className="bookings-nav">
        <a className="brand" href="/">HotelPro<span>.</span></a>
        <div><a href="/">Home</a><button type="button" onClick={() => {
          localStorage.removeItem("hotelproToken");
          localStorage.removeItem("hotelproUser");
          window.location.href = "/";
        }}>Log out</button></div>
      </nav>
      <section className="bookings-content">
        <p className="eyebrow">YOUR HOTELPRO ACCOUNT</p>
        <h1>My Bookings</h1>
        <p className="bookings-subtitle">Review your reservations and their current status.</p>
        {notice && <p className="bookings-notice">{notice}</p>}
        {error && <p className="bookings-error">{error}</p>}
        {loading ? <p>Loading your bookings...</p> : bookings.length === 0 ? (
          <div className="empty-bookings"><h2>No bookings yet</h2><p>Find a room and plan your next stay.</p><a className="booking-submit" href="/#rooms">Explore rooms</a></div>
        ) : (
          <div className="booking-list">
            {bookings.map((b) => (
              <article className="booking-record" key={b._id}>
                <div className="booking-record-head"><div><p className="eyebrow">BOOKING REFERENCE</p><strong>{b._id}</strong></div><span className={`status-pill status-${b.status}`}>{b.status}</span></div>
                <h2>{b.roomName}</h2>
                <div className="booking-record-grid">
                  <div><span>Check-in</span><strong>{dateLabel(b.checkIn)}</strong></div>
                  <div><span>Check-out</span><strong>{dateLabel(b.checkOut)}</strong></div>
                  <div><span>Guests</span><strong>{b.guests}</strong></div>
                  <div><span>Duration</span><strong>{b.nights} night(s)</strong></div>
                  <div><span>Total price</span><strong>₹{Number(b.totalPrice).toLocaleString("en-IN")}</strong></div>
                  <div><span>Payment</span><strong>{b.paymentStatus}</strong></div>
                </div>
                {["pending", "confirmed"].includes(b.status) && <button className="cancel-booking-button" onClick={() => cancelBooking(b)}>Cancel booking</button>}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
