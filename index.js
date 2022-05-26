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

    // Read all tools data
    app.get("/tools", async (req, res) => {
      const tools = await toolsCollection.find({}).toArray();
      res.send(tools);
    });

    app.get("/tool/:id", async (req, res) => {
      const productId = req.params.id;
      const tool = await toolsCollection.findOne({ _id: ObjectId(productId) });
      res.send(tool);
    });

    app.post("/order", async (req, res) => {
      const order = await orderCollection.insertOne(req.body.order);
      res.send(order);
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
