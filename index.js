const express = require("express");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 3000 || process.env.PORT;
const uri = `mongodb://localhost:27017`;

app.use(express.json());
app.use(cors());
app.use(cookieParser());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    const userCollection = client.db("ecopoShop").collection("users");
    const productCollection = client.db("ecopoShop").collection("products");
    const orderCollection = client.db("ecopoShop").collection("orders");
    const paymentCollection = client.db("ecopoShop").collection("payments");
    //
    app.post("/add-user", async (req, res) => {
      const user = req.body;
      const exist = await userCollection.findOne({ email: user?.email });
      if (exist) {
        return res.send({ message: "user already exist!" });
      }
      const userAdd = await userCollection.insertOne(user);
      res.send({ message: "success", userAdd });
    });

  } finally {
    // console.log('')
  }
};
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send(`EvoPo Shop Server Running Now ${new Date().toLocaleTimeString()}`);
});

app.listen(port, () => {
  console.log(
    `Server is running on port ${port} => ${new Date().toLocaleTimeString()}`
  );
});
