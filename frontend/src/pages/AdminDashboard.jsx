
import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API = "http://localhost:5000/api/rooms";
function getAuthConfig() {
  const token = localStorage.getItem("hotelproToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}

const emptyForm = {
  name: "",
  price: "",
  description: "",
  image: ""
};

export default function AdminDashboard() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadRooms() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API);
      setRooms(response.data);
    } catch {
      setError("Could not load rooms. Check that your backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  function startEdit(room) {
    setEditingId(room.id);
    setForm({
      name: room.name,
      price: String(room.price),
      description: room.description,
      image: room.image
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId !== null) {
       await axios.put(
  `${API}/${editingId}`,
  form,
  getAuthConfig()
);
        setMessage("Room updated successfully!");
      } else {
      await axios.post(
  API,
  form,
  getAuthConfig()
);
        setMessage("Room added successfully!");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadRooms();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save room. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRoom(room) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${room.name}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await axios.delete(
  `${API}/${room.id}`,
  getAuthConfig()
);

      if (editingId === room.id) {
        cancelEdit();
      }

      setMessage("Room deleted successfully!");
      await loadRooms();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not delete room."
      );
    }
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>HotelPro</h2>
        <p className="sidebar-caption">ADMIN PANEL</p>
        <a className="sidebar-link active" href="#overview">
          Dashboard
        </a>
        <a className="sidebar-link" href="#room-form">
          Manage Rooms
        </a>
        <a className="sidebar-link" href="/admin/bookings">Manage Bookings</a>
        <a className="sidebar-link" href="/">
          View Website
        </a>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="eyebrow">HOTEL MANAGEMENT</p>
            <h1>Admin Dashboard</h1>
            <p>Manage your rooms and room prices in one place.</p>
          </div>
          <a href="/" className="website-button">
            View Website ↗
          </a>
        </header>

        <section id="overview" className="stats-grid">
          <article className="stat-card">
            <span>Total Rooms</span>
            <h2>{rooms.length}</h2>
            <p>Rooms in your database</p>
          </article>

          <article className="stat-card">
            <span>Average Room Price</span>
            <h2>
              ₹
              {rooms.length
                ? Math.round(
                    rooms.reduce((sum, room) => sum + room.price, 0) /
                      rooms.length
                  ).toLocaleString("en-IN")
                : 0}
            </h2>
            <p>Average listed price</p>
          </article>

          <article className="stat-card">
            <span>Room Types</span>
            <h2>{new Set(rooms.map((room) => room.name)).size}</h2>
            <p>Distinct room names</p>
          </article>
        </section>

        {error && <div className="notice error">{error}</div>}
        {message && <div className="notice success">{message}</div>}

        <section id="room-form" className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ROOM INVENTORY</p>
              <h2>{editingId !== null ? "Edit Room" : "Add a New Room"}</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="room-form">
            <label>
              Room Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Deluxe Room"
                required
              />
            </label>

            <label>
              Price per Night (₹)
              <input
                name="price"
                type="number"
                min="1"
                step="1"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. 2500"
                required
              />
            </label>

            <label className="full-width">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the room..."
                rows="3"
                required
              />
            </label>

            <label className="full-width">
              Room Image URL
              <input
                name="image"
                type="url"
                value={form.image}
                onChange={handleChange}
                placeholder="https://example.com/room.jpg"
                required
              />
            </label>

            <div className="form-actions full-width">
              <button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Room"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DATABASE RECORDS</p>
              <h2>All Rooms</h2>
            </div>
            <button
              type="button"
              className="refresh-button"
              onClick={loadRooms}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading rooms...</p>
          ) : rooms.length === 0 ? (
            <p>No rooms found. Add your first room above.</p>
          ) : (
            <div className="rooms-table-wrap">
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Price / Night</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td>
                        <div className="room-cell">
                          <img
                            src={room.image}
                            alt={room.name}
                            onError={(event) => {
                              event.currentTarget.style.visibility = "hidden";
                            }}
                          />
                          <strong>{room.name}</strong>
                        </div>
                      </td>
                      <td>₹{room.price.toLocaleString("en-IN")}</td>
                      <td>{room.description}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => startEdit(room)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => deleteRoom(room)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
