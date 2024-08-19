const express = require("express");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;
// const uri = `mongodb://localhost:27017`;
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.aeratuu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ecopo-shop.web.app",
      "https://ecopo-shop.firebaseapp.com",
    ],
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
      jwt.verify(token, process.env.SECRET_TOKEN, (error, dcoded) => {
        if (error) {
          return res.status(401).send({ message: "unAuthorize accese" });
        }
        req.user = dcoded;
        nxt();
      });
    };

    //
    const userCollection = client.db("ecopoShop").collection("users");
    const productCollection = client.db("ecopoShop").collection("products");
    const orderCollection = client.db("ecopoShop").collection("orders");
    const CartCollection = client.db("ecopoShop").collection("carts");
    const FavoriteCollection = client.db("ecopoShop").collection("favorites");
    // create token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN, {
        expiresIn: "1d",
      });
      res.cookie("token", token, cookieOption).send({ message: "success" });
    });
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
    app.get("/product/:id", verifyToken, async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const result = await productCollection.findOne(filter);
      res.send(result);
    });
    //
    app.post("/favorite-add", async (req, res) => {
      const product = req.body;
      console.log(product);
      const exist = await FavoriteCollection.findOne({
        "item.name": product.item?.name,
      });
      const filter = { _id: new ObjectId(product.favo_id) };
      if (exist) {
        return res.send({ message: "product already exist" });
      }
      const update = {
        $set: {
          favorite: product?.favorite,
        },
      };
      const updateRes = await productCollection.updateOne(filter, update);
      const result = await FavoriteCollection.insertOne(product);
      return res.send(result);
    });
    app.post("/favorites", async (req, res) => {
      const email = req.query?.user;
      const page = Number(req.query?.page);
      const item = Number(req.query?.item);
      //
      const count = await FavoriteCollection.estimatedDocumentCount();
      const result = await FavoriteCollection.find({ email: email })
        .skip(page * item)
        .limit(item)
        .toArray();
      res.send({ result, count });
    });
    app.delete("/favorite-delete", async (req, res) => {
      const filter = { _id: new ObjectId(req.query.id) };
      const filter2 = { _id: new ObjectId(req.query.productId) };
      //
      const update = {
        $set: {
          favorite: false,
        },
      };
      const updateRes = await productCollection.updateOne(filter2, update);
      const result = await FavoriteCollection.deleteOne(filter);
      res.send(result);
    });
    // cart api
    app.post("/cart-add", async (req, res) => {
      const cart = req.body;
      const filter = { _id: new ObjectId(cart.product_id) };
      const exist = await CartCollection.findOne({ name: cart.name });
      if (exist) {
        return res.send({ message: "product already exist" });
      }
      const update = {
        $set: {
          cart: cart.cart,
        },
      };
      const resultUp = await productCollection.updateOne(filter, update);
      const result = await CartCollection.insertOne(cart);
      res.send(result);
      console.log(resultUp);
    });
    app.patch("/cart-remove", async (req, res) => {
      const cart = req.body;
      const filter = { _id: new ObjectId(cart._id) };
      const filter2 = { _id: new ObjectId(cart?.pro_id) };
      const update = {
        $set: {
          cart: false,
        },
      };
      const updateRes = await productCollection.updateOne(filter2, update);
      // const result = await CartCollection.deleteOne(filter);
      res.send(updateRes);
      console.log(cart);
    });
    app.post("/carts", async (req, res) => {
      const email = req.query?.email;
      const page = Number(req.query.page);
      const limit = Number(req.query.item);
      //
      const count = await CartCollection.estimatedDocumentCount();
      const result = await CartCollection.find({ customer_email: email })
      .skip(page * limit)
      .limit(limit)
        .toArray();

      res.send({ result, count });
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
