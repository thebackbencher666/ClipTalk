const express = require('express')
const app = express()
const port = process.env.PORT||6000
const cors = require('cors')

app.use(cors());
app.use(express.json());

//8gXhGHVWotLWTS7H

app.get('/', (req, res) => {
    res.send('Hello World!')
})

//mongodb configuration


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://cliptalk_store:8gXhGHVWotLWTS7H@cluster0.vbzcppm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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

    //create a collection od database

    const movieCollection = client.db("MovieInventory ").collection("movies")


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`app listening on port ${port}`);
    
})