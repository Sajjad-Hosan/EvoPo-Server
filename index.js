const express = require("express");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 3000 || process.env.PORT;
const uri = `mongodb://localhost:27017`;



app.get("/", async (req, res) => {
  res.send(`EvoPo Shop Server Running Now ${new Date().toLocaleTimeString()}`);
});

app.listen(port, () => {
  console.log(
    `Server is running on port ${port} => ${new Date().toLocaleTimeString()}`
  );
});
