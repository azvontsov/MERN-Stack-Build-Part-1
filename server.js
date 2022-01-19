// DEPENDENCIES

// get .env variables
require("dotenv").config();
// pull PORT from .env, give default value of 3001
const { PORT = 3001, DATABASE_URL } = process.env;
// const PORT = process.env || 3001
// import express from 'express
const express = require("express");
// create application object
const app = express();
// import mongoose
const mongoose = require("mongoose");
// import middleware...req => middleware => route => res
const cors = require("cors");
const morgan = require("morgan");

const admin = require("firebase-admin");

const serviceAccount = require("./service-account-credentials.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// DATABASE CONNECTION

// Establish Connection
mongoose.connect(DATABASE_URL);
// Connection Events
mongoose.connection
  .on("open", () => console.log("You are connected to MongoDB"))
  .on("close", () => console.log("You are disconnected from MongoDB"))
  .on("error", (error) => console.log(error));

// MODELS

const PeopleSchema = new mongoose.Schema({
  name: String,
  image: String,
  title: String,
  uId: String,
});

const People = mongoose.model("People", PeopleSchema);

// MiddleWare

app.use(cors());
app.use(morgan("dev"));
app.use(express.json()); // JSON.parse("{"name":"anton"}") => {name: anton}

// ROUTES

// create a test route
app.get("/", (req, res) => {
  res.send("hello world");
});

// PEOPLE INDEX ROUTE - GET
// async/await
app.get("/people", async (req, res) => {
  try {
    res.json(await People.find({}));
  } catch (error) {
    res.status(400).json(error);
  }
});
// PEOPLE CREATE ROUTE - POST
app.post("/people", async (req, res) => {
  const token = req.get("Authorization");
  if (!token)
    return res.status(400).json({ message: "you must be logged in first" });
  const user = await admin.auth().verifyIdToken(token.replace("Bearer ", ""));
  req.body.uId = user.uid;
  try {
    res.json(await People.create(req.body));
  } catch (error) {
    res.status(400).json(error);
  }
});
// PEOPLE DELETE ROUTE - POST
app.delete("/people/:id", async (req, res) => {
  try {
    res.json(await People.findByIdAndDelete(req.params.id));
  } catch (error) {
    res.status(400).json(error);
  }
});
// PEOPLE UPDATE ROUTE - POST
app.put("/people/:id", async (req, res) => {
  try {
    res.json(
      await People.findByIdAndUpdate(req.params.id, req.body, { new: true })
    );
  } catch (error) {
    res.status(400).json(error);
  }
});

// LISTENER

app.listen(PORT, () => console.log(`listening on PORT ${PORT}`));
