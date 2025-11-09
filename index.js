const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@habittrackercluster.dzxwoht.mongodb.net/?appName=HabitTrackerCluster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    await client.connect();

    const db = client.db("habitTrackerDB");
    const habitCollection = db.collection("habits");
    const userCollection = db.collection("users");

    app.locals.habitCollection = habitCollection;
    app.locals.userCollection = userCollection;

    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
  }
}

connectDB().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Habit Tracker Server is running!");
});

app.post("/users", async (req, res) => {
  const user = req.body;
  const userCollection = app.locals.userCollection;

  const query = { email: user.email };
  const existingUser = await userCollection.findOne(query);

  if (existingUser) {
    return res.send({ message: "User already exists", insertedId: null });
  }

  try {
    const result = await userCollection.insertOne(user);
    res.send(result);
  } catch (error) {
    console.error("Failed to insert user:", error);
    res.status(500).send({ message: "Failed to insert user" });
  }
});

app.post("/habits", async (req, res) => {
  const habitData = req.body;
  const habitCollection = app.locals.habitCollection;
  habitData.createdAt = new Date();
  habitData.completionHistory = [];

  try {
    const result = await habitCollection.insertOne(habitData);
    res.send(result);
  } catch (error) {
    console.error("Failed to insert habit:", error);
    res.status(500).send({ message: "Failed to insert habit" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
