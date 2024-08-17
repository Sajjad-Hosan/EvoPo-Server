const express = require("express");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 3000 || process.env.PORT;
const uri = `mongodb://localhost:27017`;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const cookieOption = {
  httpOnly: true,
  secure: process.env.EXP_ENV === "production" ? true : false,
  sameSite: process.env.EXP_ENV === "production" ? "none" : "strict",
};

const run = async () => {
  try {
    const verifyToken = (req, res, nxt) => {
      const token = req.cookies?.token;
      if (!token) {
        return res.status(401).send({ message: "unAuthorize access" });
      }
      jwt.verify(token, process.env.SECRET_TOKEN, (error, deoded) => {
        if (error) {
          return res.status(401).send({ message: "unAuthorize accese" });
        }
        req.user = deoded;
        nxt();
      });
    };

    //
    const userCollection = client.db("ecopoShop").collection("users");
    const productCollection = client.db("ecopoShop").collection("products");
    const orderCollection = client.db("ecopoShop").collection("orders");
    const paymentCollection = client.db("ecopoShop").collection("payments");
    // create token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN, {
        expiresIn: "1d",
      });
      res.cookie("token", token, cookieOption).send({ message: "success" });
    });
    //
    app.post("/add-user", verifyToken, async (req, res) => {
      const user = req.body;
      const exist = await userCollection.findOne({ email: user?.email });
      if (exist) {
        return res.send({ message: "user already exist!" });
      }
      const userAdd = await userCollection.insertOne(user);
      res.send({ message: "success", userAdd });
    });
    app.patch("/update", verifyToken, async (req, res) => {
      const user = req.body;
      const type = req.query.type;
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
          return res
            .clearCookie("token", { ...cookieOption, maxAge: 0 })
            .send({ message: "success", result });
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
    app.post("/products", verifyToken, async (req, res) => {
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
    app.get("/product/:id", verifyToken, async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const result = await productCollection.findOne(filter);
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
