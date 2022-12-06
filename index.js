const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

const JwtAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send({ message: "Unauthorized Access" });
  }
  // console.log(authHeader);
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    console.log("Connected successfully to server");

    const toolsCollection = client.db("toolsDB").collection("toolsCollection");
    const orderCollection = client.db("toolsDB").collection("orderCollection");
    const paymentsCollection = client
      .db("toolsDB")
      .collection("paymentsCollection");

    const reviewCollection = client
      .db("toolsDB")
      .collection("reviewCollection");
    const userCollection = client.db("toolsDB").collection("userCollection");

    // Read all tools data
    app.get("/tools", async (req, res) => {
      const tools = await toolsCollection.find({}).toArray();
      res.send(tools);
    });

    //Post post in to database
    app.post("/tool", async (req, res) => {
      const tool = await toolsCollection.insertOne(req.body.updatedInfo);
      res.send(tool);
    });

    // Read tool data by id
    app.get("/tool/:id", async (req, res) => {
      const productId = req.params.id;
      // console.log(id);
      const tool = await toolsCollection.findOne({ _id: ObjectId(productId) });
      res.send(tool);
    });

    app.delete("/tool/:id", async (req, res) => {
      console.log(req.params.id);
      const deletedTools = await toolsCollection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.send(deletedTools);
    });

    //Post order in to database
    app.post("/order", async (req, res) => {
      const order = await orderCollection.insertOne(req.body.order);
      res.send(order);
    });

    // Read all order data
    app.get("/orders", JwtAuth, async (req, res) => {
      const orders = await orderCollection.find({}).toArray();
      res.send(orders);
    });

    // Read order data by id
    app.get("/order/:id", JwtAuth, async (req, res) => {
      const id = req.params.id;
      const order = await orderCollection.findOne({ _id: ObjectId(id) });
      res.send(order);
    });

    // Read specific user data order data
    app.get("/orders/:email", JwtAuth, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const orders = await orderCollection.find({ userEmail: email }).toArray();
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

    /* // Read all order data
    app.get("/users", async (req, res) => {
      const reviews = await reviewCollection.find({}).toArray();
      res.send(reviews);
    });
 */
    //Post User in to database
    /* app.post("/user", async (req, res) => {
      const user = await userCollection.insertOne(req.body.user);
      console.log(user);
      res.send(user);
    }); */

    app.get("/users", JwtAuth, async (req, res) => {
      const users = await userCollection.find({}).toArray();
      res.send(users);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const newUser = {
        $set: req.body.currentUser,
      };
      console.log(req.body.currentUser);
      const user = await userCollection.updateOne(filter, newUser, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      console.log(user);
      res.send({ user, token });
    });

    app.put("/user/update/:email", JwtAuth, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedUser = req.body;
      console.log(req.body);
      const newUser = {
        $set: {
          ...updatedUser,
        },
      };
      const user = await userCollection.updateOne(filter, newUser, options);
      res.send(user);
    });

    // Delete  user data
    app.delete("/user/:email", async (req, res) => {
      console.log(req.params.email);
      const deletedUser = await userCollection.deleteOne({
        email: req.params.email,
      });
      res.send(deletedUser);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const user = await userCollection.findOne({ email: email });
      res.send(user);
    });

    app.get("/admin/:email", JwtAuth, async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user?.role == "admin";
      res.send(isAdmin);
    });

    app.put("/user/admin/:email", JwtAuth, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post("/create-payment-intent", JwtAuth, async (req, res) => {
      const totalBill = req.body.totalBill;
      const amount = totalBill * 100;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", JwtAuth, async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.orderId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          isPaid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await orderCollection.updateOne(filter, updatedDoc);
      res.send(result);
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
