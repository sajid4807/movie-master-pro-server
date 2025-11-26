const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.port || 3000;

// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.MOVIE_USER}:${process.env.MOVIE_PASS}@cluster0.a47ogqg.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



app.get('/',(req,res) => {
    res.send('movie master server is running pro')
})

async function run() {
  try {
    await client.connect();

    const db = client.db('movie_db')
    const moviesCollection = db.collection("movies")
    const userCollection = db.collection('user')
    app.post('/user', async(req,res) => {
      const newUser = req.body
      const email = req.body.email
      const query= {email: email}
      const existingUser =await userCollection.findOne(query)
      if(existingUser){
        res.send({ message: 'user already exits. do not need to insert again' })
      }
      else{
        const result = await userCollection.insertOne(newUser)
        res.send(result)
      }
    })
    app.get('/movies',async(req,res) => {
        const cursor = moviesCollection.find().sort({releaseYear: -1}).limit(6)
        const result = await cursor.toArray()
        res.send(result)
    })
    app.get('/allMovies',async(req,res) => {
      // console.log(req.query)
        const cursor = moviesCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/allMovies/:id', async(req,res) => {
        const id = req.params.id;
        // const query ={_id: id}
        const query = { _id: new ObjectId(id) }
        const result = await moviesCollection.findOne(query)
        res.send(result)
    })

    app.get('/my-collection',async(req,res) => {
      const email = req.query.email
      if(email !== req.token_email){
        return res.status(403).send({message: 'Forbidden Access'})
      }
      const result = await moviesCollection.find({addedBy: email}).toArray()
      res.send(result)
    })
    

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  finally {

  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`movie master server is running port: ${port}`)
})