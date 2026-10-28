import React, { useEffect, useState } from "react";
import axios from "axios";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBookings from "./pages/AdminBookings";
import MyBookings from "./pages/MyBookings";
import "./App.css";

const API = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api`;

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function App() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hotelproUser") || "null"); }
    catch { return null; }
  });

  useEffect(() => {
    if (["/admin", "/admin/"].includes(window.location.pathname)) return;
    if (window.location.pathname === "/login" || window.location.pathname === "/my-bookings") return;
    axios.get(`${API}/rooms`)
      .then((r) => setRooms(r.data))
      .catch((e) => console.error("Could not load rooms:", e))
      .finally(() => setLoading(false));
  }, []);

  if (window.location.pathname === "/admin/bookings") return <AdminBookings />;
  if (window.location.pathname === "/admin" || window.location.pathname === "/admin/") return <AdminDashboard />;
  if (window.location.pathname === "/login") return <Auth />;
  if (window.location.pathname === "/my-bookings") return <MyBookings />;

  function openBookingForm(room) {
    const token = localStorage.getItem("hotelproToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    let currentUser = user;
    try { currentUser = JSON.parse(localStorage.getItem("hotelproUser") || "null"); } catch { currentUser = null; }
    setGuestName(currentUser?.name || "");
    setGuestEmail(currentUser?.email || "");
    setSelectedRoom(room);
    setBookingError("");
    setBookingMessage("");
  }

  async function handleBooking(event) {
    event.preventDefault();
    setBookingError("");
    setBookingMessage("");
    if (!selectedRoom) return;
    if (!checkIn || !checkOut || checkIn < todayString() || checkOut <= checkIn) {
      setBookingError("Choose a valid check-in and check-out date.");
      return;
    }
    if (!guestName.trim() || !guestEmail.trim()) {
      setBookingError("Enter the guest name and email.");
      return;
    }
    const token = localStorage.getItem("hotelproToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    try {
      setBookingLoading(true);
      const response = await axios.post(`${API}/bookings`, {
        roomId: selectedRoom.id, guestName: guestName.trim(),
        guestEmail: guestEmail.trim(), checkIn, checkOut, guests: Number(guests)
      }, { headers: { Authorization: `Bearer ${token}` } });
      const b = response.data.booking;
      setBookingMessage(`Booking created successfully! Reference: ${b._id}. Total: ₹${Number(b.totalPrice).toLocaleString("en-IN")}`);
      setSelectedRoom(null);
      setCheckIn(""); setCheckOut(""); setGuests("2");
    } catch (error) {
      setBookingError(error.response?.data?.message || "Could not create booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  }

  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(`${checkOut}T00:00:00`) - new Date(`${checkIn}T00:00:00`)) / 86400000) : 0;

  function logout() {
    localStorage.removeItem("hotelproToken");
    localStorage.removeItem("hotelproUser");
    setUser(null);
    window.location.href = "/";
  }

  return (
    <div>
      <nav className="navbar">
        <a className="brand" href="/">HotelPro<span>.</span></a>
        <div className="nav-links">
          <a href="#home">Home</a><a href="#rooms">Our Rooms</a><a href="#about">About</a><a href="#contact">Contact</a>
        </div>
        {user ? (
          <div className="nav-links">
            <a href="/my-bookings">My Bookings</a>
            {user.role === "admin" && <a href="/admin">Admin</a>}
            <button type="button" className="nav-button" onClick={logout}>Log out</button>
          </div>
        ) : <a className="nav-button" href="/login">Login / Register</a>}
      </nav>

      <header className="hero" id="home">
        <div className="hero-content">
          <p className="eyebrow">WELCOME TO HOTELPRO</p>
          <h1>Your comfort.<br />Our priority.</h1>
          <p className="hero-text">Discover thoughtfully designed rooms, warm hospitality, and a stay worth remembering.</p>
          <a className="primary-button" href="#rooms">Explore Our Rooms →</a>
        </div>
      </header>

      <section className="search-section">
        <form className="search-form" onSubmit={(e) => { e.preventDefault(); document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" }); }}>
          <label>CHECK-IN<input type="date" min={todayString()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required /></label>
          <label>CHECK-OUT<input type="date" min={checkIn || todayString()} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required /></label>
          <label>GUESTS<select value={guests} onChange={(e) => setGuests(e.target.value)}><option value="1">1 Guest</option><option value="2">2 Guests</option><option value="3">3 Guests</option><option value="4">4 Guests</option></select></label>
          <button className="search-button" type="submit">Find a Room</button>
        </form>
      </section>

      <section className="rooms-section" id="rooms">
        <div className="section-heading"><p className="eyebrow">STAY YOUR WAY</p><h2>Rooms designed for you</h2><p>Find the perfect space for your next getaway.</p></div>
        {loading && <p>Loading rooms...</p>}
        {!loading && rooms.length === 0 && <p>No rooms available right now. Please check that the backend is running.</p>}
        <div className="room-grid">
          {rooms.map((room) => (
            <article className="room-card" key={room.id}>
              <img src={room.image} alt={room.name} />
              <div className="room-details"><h3>{room.name}</h3><p>{room.description}</p>
                <div className="room-footer"><div><strong>₹{Number(room.price).toLocaleString("en-IN")}</strong><span> / night</span></div>
                  <button type="button" onClick={() => openBookingForm(room)}>Book Now →</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {bookingMessage && <p role="status" style={{ color: "green", marginTop: 20 }}>{bookingMessage} <a href="/my-bookings">View my bookings</a></p>}
      </section>

      {selectedRoom && <div className="booking-overlay" role="presentation">
        <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
          <button type="button" className="booking-close" onClick={() => setSelectedRoom(null)} aria-label="Close booking form">×</button>
          <p className="eyebrow">RESERVE YOUR STAY</p><h2 id="booking-title">{selectedRoom.name}</h2>
          <p>₹{Number(selectedRoom.price).toLocaleString("en-IN")} per night</p>
          <form onSubmit={handleBooking} className="booking-form">
            <label>Check-in<input type="date" min={todayString()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required /></label>
            <label>Check-out<input type="date" min={checkIn || todayString()} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required /></label>
            <label>Guests<select value={guests} onChange={(e) => setGuests(e.target.value)}><option value="1">1 Guest</option><option value="2">2 Guests</option><option value="3">3 Guests</option><option value="4">4 Guests</option></select></label>
            <label>Guest name<input value={guestName} onChange={(e) => setGuestName(e.target.value)} required /></label>
            <label>Guest email<input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required /></label>
            {nights > 0 && <p className="booking-total">{nights} night(s) · Total <strong>₹{(nights * selectedRoom.price).toLocaleString("en-IN")}</strong></p>}
            {bookingError && <p role="alert" className="booking-error">{bookingError}</p>}
            <button className="booking-submit" type="submit" disabled={bookingLoading}>{bookingLoading ? "Booking..." : "Confirm Booking"}</button>
            <p className="booking-note">Payment is not collected in this demo. Your reservation will be saved with payment pending.</p>
          </form>
        </section>
      </div>}

      <section className="about-section" id="about"><p className="eyebrow">THE HOTELPRO EXPERIENCE</p><h2>A better stay starts here.</h2><p>Enjoy comfort, convenience, and a simple way to discover your next room.</p></section>
      <footer id="contact"><a className="brand footer-brand" href="#home">HotelPro<span>.</span></a><p>Your next stay starts with us.</p><p>© {new Date().getFullYear()} HotelPro. All rights reserved.</p></footer>
    </div>
  );
}

export default App;
