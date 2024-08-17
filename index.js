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
    app.patch("/update", async (req, res) => {
      const user = req.body;
      const type = req.query.type;
      console.log(user);
      const exist = await userCollection.findOne({ email: user?.email });
      if (exist) {
        if (type === "logout") {
          const update = {
            $set: {
              logoutTime: user?.logoutTime,
              logoutDate: user?.logoutDate,
            },
          };
          const result = await userCollection.updateOne(
            { email: user?.email },
            update
          );
          return res.send({ message: "success", result });
        } else if (type === "login") {
          const update = {
            $set: {
              loginTime: user?.loginTime,
              LoginDate: user?.LoginDate,
            },
          };
          const result = await userCollection.updateOne(
            { email: user?.email },
            update
          );
          return res.send({ message: "success", result });
        }
        return res.send({ message: "error" });
      }
    });
    //
    app.get("/product-count", async (req, res) => {
      const count = await productCollection.estimatedDocumentCount();
      res.send({ count });
    });
    app.post("/products", async (req, res) => {
      const page = Number(req.query?.page);
      const item = Number(req.query?.item);
      //
      const search = req.query?.search;
      const category = req.query?.category;
      const sort = req.query?.sort;
      const sortObject = {};
      if (category) {
        sortObject[category] = 1;
      }
      if (sort === "new") {
        sortObject.creation_date - 1;
      } else if (sort === "low") {
        sortObject.price = 1;
      } else if (sort === "high") {
        sortObject.price = -1;
      } else {
        sortObject.category = 1;
      }
      if (!search == " ") {
        const result = await productCollection
          .find({ name: { $regex: search } })
          .sort(sortObject)
          .skip(page * item)
          .limit(item)
          .toArray();
        res.send(result);
        return;
      }
      const result = await productCollection
        .find()
        .sort(sortObject)
        .skip(page * item)
        .limit(item)
        .toArray();
      res.send(result);
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
