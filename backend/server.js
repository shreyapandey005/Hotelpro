const Room = require("./models/Room");
const bookingRoutes = require("./routes/bookings");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const authRoutes = require("./routes/auth");
const {
  authenticateToken,
  requireAdmin
} = require("./middleware/authMiddleware");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

// Room schema: defines how room data is stored in MongoDB

// Initial room data for a new, empty collection
const defaultRooms = [
  {
    id: 1,
    name: "Deluxe Room",
    price: 2500,
    description: "A comfortable room for a relaxing stay.",
    image:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"
  },
  {
    id: 2,
    name: "Luxury Suite",
    price: 4500,
    description: "Spacious interiors with a premium experience.",
    image:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"
  },
  {
    id: 3,
    name: "Family Room",
    price: 3500,
    description: "Extra space for a comfortable family holiday.",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800"
  }
];

// Home route
app.get("/", (req, res) => {
  res.send("HotelPro backend is running successfully!");
});

// Get rooms from MongoDB
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error.message);
    res.status(500).json({ message: "Could not fetch rooms" });
  }
});

const roomFields = ["name", "price", "description", "image"];

// Add a new room
app.post(
  "/api/rooms",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
  try {
    const { name, price, description, image } = req.body;

    if (
      !name?.trim() ||
      price === undefined ||
      price === "" ||
      !description?.trim() ||
      !image?.trim()
    ) {
      return res.status(400).json({
        message: "Please fill in all room fields."
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        message: "Price must be a number greater than zero."
      });
    }

    const lastRoom = await Room.findOne().sort({ id: -1 });
    const nextId = lastRoom ? lastRoom.id + 1 : 1;

    const room = await Room.create({
      id: nextId,
      name: name.trim(),
      price: numericPrice,
      description: description.trim(),
      image: image.trim()
    });

    res.status(201).json(room);
  } catch (error) {
    console.error("Add room error:", error.message);
    res.status(500).json({ message: "Could not add room." });
  }
});

// Update an existing room
app.put(
  "/api/rooms/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
  try {
    const updates = {};

    for (const field of roomFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (
      updates.name !== undefined &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return res.status(400).json({ message: "Room name is required." });
    }

    if (
      updates.description !== undefined &&
      (typeof updates.description !== "string" ||
        !updates.description.trim())
    ) {
      return res.status(400).json({
        message: "Room description is required."
      });
    }

    if (
      updates.image !== undefined &&
      (typeof updates.image !== "string" || !updates.image.trim())
    ) {
      return res.status(400).json({ message: "Room image URL is required." });
    }

    if (updates.name !== undefined) updates.name = updates.name.trim();
    if (updates.description !== undefined) {
      updates.description = updates.description.trim();
    }
    if (updates.image !== undefined) updates.image = updates.image.trim();

    if (updates.price !== undefined) {
      const numericPrice = Number(updates.price);

      if (
        updates.price === "" ||
        !Number.isFinite(numericPrice) ||
        numericPrice <= 0
      ) {
        return res.status(400).json({
          message: "Price must be a number greater than zero."
        });
      }

      updates.price = numericPrice;
    }

    const room = await Room.findOneAndUpdate(
      { id: Number(req.params.id) },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    res.json(room);
  } catch (error) {
    console.error("Update room error:", error.message);
    res.status(500).json({ message: "Could not update room." });
  }
});

// Delete a room
app.delete(
  "/api/rooms/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({
      id: Number(req.params.id)
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    res.json({ message: "Room deleted successfully." });
  } catch (error) {
    console.error("Delete room error:", error.message);
    res.status(500).json({ message: "Could not delete room." });
  }
});


// Connect to MongoDB and start the server
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    // Add sample rooms only when the collection is empty
    const roomCount = await Room.countDocuments();

    if (roomCount === 0) {
      await Room.insertMany(defaultRooms);
      console.log("Default rooms added to MongoDB!");
    }

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`HotelPro server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
}

startServer();
