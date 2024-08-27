const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

// middlewares

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://restaurant-management-89e37.web.app",
      "https://restaurant-management-89e37.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// custom middleware

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decode) => {
    if (error) {
      // console.log(error);

      return res.status(401).send({ message: "unauthorized" });
    }
    // console.log("token is decoded",decode);
    req.user = decode;
    next();
  });
};

// console.log(process.env.DB_USER);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a2ulpwj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // jwt

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log(user);

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      // console.log(user);

      res.clearCookie("token", { httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 0 }).send({ success: true });
    });

    const foodsCollection = client
      .db("restaurant_management")
      .collection("foods");
    const purchasesCollection = client
      .db("restaurant_management")
      .collection("purchases");
    const galleryCollection = client
      .db("restaurant_management")
      .collection("gallery");

    //add food in food collection

    app.post("/foods", async (req, res) => {
      const docs = req.body;
      // console.log(docs);

      const result = await foodsCollection.insertOne(docs);
      res.send(result);
    });

    // get all foods

    app.get("/foods", async (req, res) => {
      const cursor = foodsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get 6 top-selling Food Items

    app.get("/top-selling-foods", async (req, res) => {
      const topSellingFoods = await foodsCollection
        .find({})
        .sort({ totalPurchase: -1 })
        .limit(6)
        .toArray();

      res.send(topSellingFoods);
    });

    // get foods by foodName

    app.get("/foods/:name", async (req, res) => {
      const name = req.params.name;
      // console.log(name);
      const query = { foodName: { $regex: new RegExp(name, "i") } };
      const result = await foodsCollection.find(query).toArray();

      res.send(result);
    });

    // get foods by id

    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });
    // get foods by email

    app.get("/foods/user/:email", verifyToken, async (req, res) => {
      const emailId = req.params.email;
      // console.log(emailId);
      if (req.user.email !== emailId) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: emailId };
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    // update foods item

    app.patch("/update/:id", async (req, res) => {
      const data = req.body;
      const id = req.params.id;
      // console.log("update info", data);
      // console.log("food id", id);
      const filter = { _id: new ObjectId(id) };
      const updateDocs = {
        $set: data,
      };
      const result = await foodsCollection.updateOne(filter, updateDocs);
      res.send(result);
    });

    // insert purchase details

    app.post("/purchase/:id", async (req, res) => {
      const docs = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = {
        $inc: {
          totalPurchase: 1,
          quantity: -1,
        },
      };

      // console.log(id);

      const updateFoods = await foodsCollection.updateOne(query, update);
      const result = await purchasesCollection.insertOne(docs);
      res.send({ result, updateFoods });
    });

    // get purchase food by email

    app.get("/purchase/:email", verifyToken, async (req, res) => {
      const emailId = req.params.email;
      // console.log(emailId);
      if (req.user.email !== emailId) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: emailId };
      const result = await purchasesCollection.find(query).toArray();
      res.send(result);
    });

    //delete purchase item

    app.delete("/purchase/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await purchasesCollection.deleteOne(query);
      res.send(result);
    });

    //insert gallery info

    app.post("/gallery", async (req, res) => {
      const docs = req.body;
      console.log(docs);

      const result = await galleryCollection.insertOne(docs);
      res.send(result);
    });

    // get data from gallery collection

    app.get("/gallery", async (req, res) => {
      const cursor = galleryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running ");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
