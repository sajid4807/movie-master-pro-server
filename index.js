const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.port || 3000;


const uri = `mongodb+srv://${process.env.MOVIE_USER}:${process.env.MOVIE_PASS}@cluster0.a47ogqg.mongodb.net/?appName=Cluster0`;

// middleware
app.use(cors())
app.use(express.json())

app.get('/',(req,res) => {
    res.send('movie master server is running pro')
})

app.listen(port, () => {
    console.log(`movie master server is running port: ${port}`)
})