require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const hash = await bcrypt.hash("Manish1234", 10);
  
  await mongoose.connection.collection("users").updateOne(
    { username: "manish" },
    { $set: { password: hash } }
  );

  console.log("✅ Password update ho gaya!");
  process.exit();
}).catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});