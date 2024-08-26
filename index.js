const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express()

// middlewares 

app.use(cors())
app.use(express.json())


console.log(process.env.DB_USER);



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a2ulpwj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    
    const foodsCollection = client.db("restaurant_management").collection("foods")
    const purchasesCollection = client.db("restaurant_management").collection("purchases")
    const galleryCollection = client.db("restaurant_management").collection("gallery")

    // get all foods 

    app.get("/foods", async(req, res) => {
        const cursor = foodsCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

        // get foods by foodName

        app.get("/foods/:name", async(req, res) => {
          const name = req.params.name;
          // console.log(name);
          const query = {foodName:  { $regex: new RegExp(name, "i") }};
          const result = await foodsCollection.find(query).toArray()
          
          res.send(result);
          
        })

        // get foods by id

        app.get("/food/:id", async(req, res) => {
          const id = req.params.id;
          // console.log(id);
          const query = {_id: new ObjectId(id)};
          const result =  await foodsCollection.findOne(query) 
          res.send(result);
          
        })
        // get foods by email

        app.get("/foods/user/:email", async(req, res) => {
          const emailId = req.params.email;
          console.log(emailId);
          const query = {email: emailId};
          const result =  await foodsCollection.find(query).toArray()
          res.send(result);
          
        })

        // update foods item 

        app.patch("/update/:id", async(req, res) => {
          const data = req.body;
          const id = req.params.id;
          console.log("update info",data);
          console.log("food id",id);
          const filter = { _id: new ObjectId(id) };
          const updateDocs = {
            $set: data
          }
          const result = await foodsCollection.updateOne(filter, updateDocs)
          res.send(result)
          
        })

        // insert purchase details 

        app.post("/purchase", async (req, res) => {
          const docs = req.body;
          console.log(docs);
          
          const result = await purchasesCollection.insertOne(docs);
          res.send(result);
        })

        //insert gallery info

        app.post("/gallery", async (req, res) => {
          const docs = req.body;
          console.log(docs);
          
          const result = await galleryCollection.insertOne(docs);
          res.send(result);
        })

        // get data from gallery collection 

        app.get("/gallery", async(req, res) => {
          const cursor = galleryCollection.find()
          const result = await cursor.toArray()
          res.send(result)
      })






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.get("/", (req, res) => {
    res.send("server is running ")
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
    
})