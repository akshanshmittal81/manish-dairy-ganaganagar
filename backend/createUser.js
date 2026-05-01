require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const hash = await bcrypt.hash("Manish1234", 10);
  
  const user = new User({
    username: "manish",
    password: "manish123",
    shopName: "Manish Dairy"
  });

  await user.save();
  console.log("✅ User bana diya! Ab login karo.");
  process.exit();
}).catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});