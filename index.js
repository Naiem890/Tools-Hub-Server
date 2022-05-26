const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cavm6.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    console.log("Connected successfully to server");

    const toolsCollection = client.db("toolsDB").collection("toolsCollection");
    const orderCollection = client.db("toolsDB").collection("orderCollection");
    const reviewCollection = client
      .db("toolsDB")
      .collection("reviewCollection");

    // Read all tools data
    app.get("/tools", async (req, res) => {
      const tools = await toolsCollection.find({}).toArray();
      res.send(tools);
    });

    // Read tool data by id
    app.get("/tool/:id", async (req, res) => {
      const productId = req.params.id;
      const tool = await toolsCollection.findOne({ _id: ObjectId(productId) });
      res.send(tool);
    });

    //Post order in to database
    app.post("/order", async (req, res) => {
      const order = await orderCollection.insertOne(req.body.order);
      res.send(order);
    });

    // Read all order data
    app.get("/orders", async (req, res) => {
      const orders = await orderCollection.find({}).toArray();
      res.send(orders);
    });

    // Delete  order data
    app.delete("/order/:id", async (req, res) => {
      console.log(req.params.id);
      const deletedOrder = await orderCollection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.send(deletedOrder);
    });

    //Post Review in to database
    app.post("/review", async (req, res) => {
      const review = await reviewCollection.insertOne(req.body.review);
      res.send(review);
    });

    // Read all order data
    app.get("/reviews", async (req, res) => {
      const reviews = await reviewCollection.find({}).toArray();
      res.send(reviews);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
