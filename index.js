const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");
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

app.get("/habits/featured", async (req, res) => {
  const habitCollection = app.locals.habitCollection;
  try {
    const featuredHabits = await habitCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    res.send(featuredHabits);
  } catch (error) {
    console.error("Failed to get featured habits:", error);
    res.status(500).send({ message: "Failed to get featured habits" });
  }
});

app.get("/habits/:email", async (req, res) => {
  const userEmail = req.params.email;
  const habitCollection = app.locals.habitCollection;

  try {
    const query = { userEmail: userEmail };
    const userHabits = await habitCollection.find(query).toArray();
    res.send(userHabits);
  } catch (error) {
    console.error("Failed to get user habits:", error);
    res.status(500).send({ message: "Failed to get user habits" });
  }
});

app.delete("/habits/:id", async (req, res) => {
  const id = req.params.id;
  const habitCollection = app.locals.habitCollection;

  try {
    const query = { _id: new ObjectId(id) };
    const result = await habitCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error("Failed to delete habit:", error);
    res.status(500).send({ message: "Failed to delete habit" });
  }
});

app.patch("/habits/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  const habitCollection = app.locals.habitCollection;

  try {
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        title: updatedData.title,
        description: updatedData.description,
        category: updatedData.category,
        reminderTime: updatedData.reminderTime,
        image: updatedData.image,
      },
    };
    const result = await habitCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Failed to update habit:", error);
    res.status(500).send({ message: "Failed to update habit" });
  }
});

app.patch("/habits/complete/:id", async (req, res) => {
  const id = req.params.id;
  const habitCollection = app.locals.habitCollection;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const filter = { _id: new ObjectId(id) };

    const habit = await habitCollection.findOne(filter);
    const alreadyCompleted = habit.completionHistory.some((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (alreadyCompleted) {
      return res.send({
        message: "Habit already completed today.",
        modifiedCount: 0,
      });
    }

    const updateDoc = {
      $push: {
        completionHistory: { date: new Date() },
      },
    };
    const result = await habitCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Failed to mark habit complete:", error);
    res.status(500).send({ message: "Failed to mark habit complete" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
