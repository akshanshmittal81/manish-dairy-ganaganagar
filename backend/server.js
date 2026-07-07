const express = require("express");
const Bill = require("./models/Bill");
const mongoose = require("mongoose");
const cors = require("cors");


require("dotenv").config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" })); 
app.use(express.json());

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose.set("bufferCommands", false);
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/manish_dairy", {
  serverSelectionTimeoutMS: 2000, // Fail fast (2s) if DB is offline
})
  .then(async () => {
    console.log("✅ MongoDB connected");
    await seedDatabaseIfEmpty();
  })
  .catch(err => {
    console.warn("⚠️ MongoDB not connected — Using high-performance in-memory fallback database!");
  });

async function seedDatabaseIfEmpty() {
  try {
    const Product = require("./models/Product");
    const Category = require("./models/Category");
    const User = require("./models/User");
    const Customer = require("./models/Customer");
    const Bill = require("./models/Bill");
    const { collections } = require("./utils/inMemoryDb");

    // 1. Seed Categories if empty
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      console.log("🌱 Seeding Categories in MongoDB...");
      for (const cat of collections.Category) {
        await Category.create(cat);
      }
    }

    // 2. Seed Products if empty
    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      console.log("🌱 Seeding Products in MongoDB...");
      for (const prod of collections.Product) {
        await Product.create(prod);
      }
    }

    // 3. Seed Users if empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("🌱 Seeding Users in MongoDB...");
      await User.create({
        username: "admin",
        password: "admin",
        shopName: "Manish Dairy"
      });
      await User.create({
        username: "manish",
        password: "manish123",
        shopName: "Manish Dairy"
      });
    }

    // 4. Seed Customers if empty
    const custCount = await Customer.countDocuments();
    if (custCount === 0) {
      console.log("🌱 Seeding Customers in MongoDB...");
      for (const cust of collections.Customer) {
        await Customer.create(cust);
      }
    }

    // 5. Seed Bills if empty
    const billCount = await Bill.countDocuments();
    if (billCount === 0) {
      console.log("🌱 Seeding Bills in MongoDB...");
      for (const bill of collections.Bill) {
        await Bill.create(bill);
      }
    }
    
    console.log("✅ Seeding check completed successfully!");
  } catch (err) {
    console.error("❌ Seeding error:", err);
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/products",  require("./routes/products"));
app.use("/api/bills",     require("./routes/bills"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/auth", require("./routes/auth")); 
app.use("/api/categories", require("./routes/categories"));


// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// ─── Static Files & SPA Fallback ─────────────────────────────────────────────
const path = require("path");
const distPath = path.join(__dirname, "../frontend/build");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));
