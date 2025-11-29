const express = require("express");
const cors = require("cors");
const app = express();
const admin = require("firebase-admin");
const serviceAccount = require("./movie-master-key.json");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.port || 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middleware
app.use(cors());
app.use(express.json());
const verifyFirebaseToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = await authorization.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.token_email = decoded.email;
    // console.log(authorization,token,decoded)
    next();
  } catch (error) {
    return res.status(401).send({ message: "unauthorize access" });
  }
};

const uri = `mongodb+srv://${process.env.MOVIE_USER}:${process.env.MOVIE_PASS}@cluster0.a47ogqg.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("movie master server is running pro");
});

async function run() {
  try {
    // await client.connect();

    const db = client.db("movie_db");
    const moviesCollection = db.collection("movies");
    const userCollection = db.collection("user");
    const watchCollection = db.collection("watch");

    app.get('/user',async(req,res) => {
      const cursor = userCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.post("/user", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        res.send({
          message: "user already exits. do not need to insert again",
        });
      } else {
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      }
    });
    app.get("/movies", async (req, res) => {
      const cursor = moviesCollection.find().sort({ releaseYear: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/allMovies", async (req, res) => {
      const cursor = moviesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/allMovies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await moviesCollection.findOne(query);
      res.send(result);
    });

    app.get("/my-collection", verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
      if (email !== req.token_email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const result = await moviesCollection.find({ addedBy: email }).toArray();
      res.send(result);
    });

    app.post("/allMovies/add", verifyFirebaseToken, async (req, res) => {
      const newMovies = req.body;
      const result = await moviesCollection.insertOne(newMovies);
      res.send(result);
    });


    app.get("/my-watch-list",verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
      const result = await watchCollection.find({ watch_by: email }).toArray();
      res.send(result);
    });
    app.post("/watch-list", async (req, res) => {
      const {_id,...newMovies} = req.body;
      const result = await watchCollection.insertOne(newMovies);
      res.send(result);
    });


    app.patch("/allMovies/:id",verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const movie = await moviesCollection.findOne({ _id: new ObjectId(id) });
      const updateMovies = req.body;
      if (movie.addedBy !== req.token_email) {
        return res
          .status(403)
          .send({ message: "You are not allowed to update this movie" });
      }
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updateMovies,
      };
      const result = await moviesCollection.updateOne(query, update);
      res.send(result);
    });
    app.delete("/allMovies/:id",verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const post =await moviesCollection.findOne(query)
        if (!post) {
    return res.status(404).send({ message: "Movie not found" });
  }

  if (post.addedBy !== req.token_email) {
    return res.status(403).send({ message: "You are not allowed to delete this movie" });
  }
      const result = await moviesCollection.deleteOne(query);
      res.send(result);
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`movie master server is running port: ${port}`);
});
