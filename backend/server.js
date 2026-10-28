
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Room = require("./models/Room");
const bookingRoutes = require("./routes/bookings");
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

const roomFields = ["name", "price", "description", "image"];

app.get("/", (req, res) => {
  res.send("HotelPro backend is running successfully!");
});

// Get rooms
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error.message);
    res.status(500).json({ message: "Could not fetch rooms." });
  }
});

// Add room
app.post(
  "/api/rooms",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { name, price, description, image } = req.body;

      if (
        typeof name !== "string" ||
        !name.trim() ||
        price === undefined ||
        price === "" ||
        typeof description !== "string" ||
        !description.trim() ||
        typeof image !== "string" ||
        !image.trim()
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
  }
);

// Update room
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

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          message: "No valid room fields provided."
        });
      }

      for (const field of ["name", "description", "image"]) {
        if (updates[field] !== undefined) {
          if (
            typeof updates[field] !== "string" ||
            !updates[field].trim()
          ) {
            return res.status(400).json({
              message: `${field} must not be empty.`
            });
          }

          updates[field] = updates[field].trim();
        }
      }

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
        return res.status(404).json({
          message: "Room not found."
        });
      }

      res.json(room);
    } catch (error) {
      console.error("Update room error:", error.message);
      res.status(500).json({
        message: "Could not update room."
      });
    }
  }
);

// Delete room
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
        return res.status(404).json({
          message: "Room not found."
        });
      }

      res.json({ message: "Room deleted successfully." });
    } catch (error) {
      console.error("Delete room error:", error.message);
      res.status(500).json({
        message: "Could not delete room."
      });
    }
  }
);

// Connect to MongoDB, then start Express
async function startServer() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGO_URI is missing. Configure it in backend/.env locally or Render Environment."
      );
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully!");

    const roomCount = await Room.countDocuments();

    if (roomCount === 0) {
      await Room.insertMany(defaultRooms);
      console.log("Default rooms added to MongoDB!");
    }

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`HotelPro server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
}

startServer();
