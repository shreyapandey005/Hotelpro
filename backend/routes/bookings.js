
const express = require("express");
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const {
  authenticateToken,
  requireAdmin
} = require("../middleware/authMiddleware");

const router = express.Router();

// Create a booking
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      roomId,
      guestName,
      guestEmail,
      checkIn,
      checkOut,
      guests
    } = req.body;

    if (
      roomId === undefined ||
      !guestName?.trim() ||
      !guestEmail?.trim() ||
      !checkIn ||
      !checkOut ||
      !Number.isInteger(Number(guests)) ||
      Number(guests) < 1
    ) {
      return res.status(400).json({
        message: "Please provide all booking details."
      });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid booking dates."
      });
    }

    const startDay = Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate()
    );

    const endDay = Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate()
    );

    const now = new Date();
    const today = Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (startDay < today || endDay <= startDay) {
      return res.status(400).json({
        message: "Choose a valid check-in and check-out date."
      });
    }

    const room = await Room.findOne({
      id: Number(roomId)
    });

    if (!room) {
      return res.status(404).json({
        message: "Room not found."
      });
    }

    const conflict = await Booking.findOne({
      roomId: room.id,
      status: { $ne: "cancelled" },
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    });

    if (conflict) {
      return res.status(409).json({
        message: "This room is already booked for those dates."
      });
    }

    const nights = (endDay - startDay) / 86400000;

    const booking = await Booking.create({
      user: req.user._id,
      roomId: room.id,
      roomName: room.name,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim().toLowerCase(),
      checkIn: start,
      checkOut: end,
      guests: Number(guests),
      nights,
      totalPrice: nights * room.price
    });

    return res.status(201).json({
      message: "Booking created successfully!",
      booking
    });
  } catch (error) {
    console.error("Create booking error:", error.message);
    return res.status(500).json({
      message: "Could not create booking."
    });
  }
});

// Customer: view their own bookings
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Get my bookings error:", error.message);
    res.status(500).json({
      message: "Could not load your bookings."
    });
  }
});


// Customer: cancel their own pending or confirmed booking
router.patch("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        message: "This booking can no longer be cancelled online."
      });
    }

    booking.status = "cancelled";
    if (booking.paymentStatus === "paid") {
      booking.paymentStatus = "refunded";
    }
    await booking.save();

    return res.json({ message: "Booking cancelled.", booking });
  } catch (error) {
    console.error("Cancel booking error:", error.message);
    return res.status(500).json({ message: "Could not cancel booking." });
  }
});

// Admin: view all bookings
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Get all bookings error:", error.message);
    res.status(500).json({
      message: "Could not load bookings."
    });
  }
});

// Admin: update booking status
router.patch(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const allowedStatuses = [
        "pending",
        "confirmed",
        "cancelled",
        "checked-in",
        "checked-out"
      ];

      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({
          message: "Invalid booking status."
        });
      }

      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      );

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found."
        });
      }

      res.json({
        message: "Booking status updated.",
        booking
      });
    } catch (error) {
      console.error("Update booking error:", error.message);
      res.status(500).json({
        message: "Could not update booking."
      });
    }
  }
);

module.exports = router;
