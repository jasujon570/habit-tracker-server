const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb"); // Mongoose-এর বদলে এটা
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- MongoDB কানেকশন (Mongoose ছাড়া) ---
// .env ফাইল থেকে ইউজার-পাসওয়ার্ড নিচ্ছে
// mongodb+srv://habit_user:P@ssword123@habittrackercluster.dzxwoht.mongodb.net/?appName=HabitTrackerCluster
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@habittrackercluster.dzxwoht.mongodb.net/?appName=HabitTrackerCluster`;
// ! দ্রষ্টব্য: আপনার Atlas কানেকশন স্ট্রিং থেকে 'your_cluster_url' অংশটি রিপ্লেস করুন
// এবং ডেটাবেসের নাম 'habitTrackerDB' দিন।

// নতুন MongoClient তৈরি করা
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    // ক্লায়েন্ট কানেক্ট করা
    await client.connect();

    // ডেটাবেস এবং কালেকশনগুলো সেট করা
    const db = client.db("habitTrackerDB"); // ডেটাবেসের নাম
    const habitCollection = db.collection("habits"); // 'habits' কালেকশন
    const userCollection = db.collection("users"); // 'users' কালেকশন

    // কালেকশনগুলো app.locals-এ সেভ করা, যাতে সব রুট থেকে পাওয়া যায়
    app.locals.habitCollection = habitCollection;
    app.locals.userCollection = userCollection;

    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
  // finally {
  // Note: client.close() এখানে কল করবেন না, কারণ সার্ভার চললে কানেকশন চালু থাকবে
  // }
}

// সার্ভার চালু হলেই ডেটাবেস কানেক্ট ফাংশনটি রান করবে
connectDB().catch(console.dir);
// --- MongoDB কানেকশন শেষ ---

app.get("/", (req, res) => {
  res.send("Habit Tracker Server is running!");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
