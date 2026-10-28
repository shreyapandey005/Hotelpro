
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const User = require("./models/User");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const email = (await ask("Admin email: "))
      .trim()
      .toLowerCase();

    const password = await ask("Admin password (minimum 12 characters): ");

    if (!email || password.length < 12) {
      throw new Error(
        "Enter a valid email and a password of at least 12 characters."
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.role = "admin";
      existingUser.password = await bcrypt.hash(password, 12);
      await existingUser.save();

      console.log("Existing account promoted to admin.");
    } else {
      const name = (await ask("Admin name: ")).trim();

      if (!name) {
        throw new Error("Admin name is required.");
      }

      await User.create({
        name,
        email,
        password: await bcrypt.hash(password, 12),
        role: "admin"
      });

      console.log("Admin account created successfully.");
    }
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  }
}

main();
