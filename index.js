const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Welcome to Venture Bengal server");
});

app.listen(port, () => {
  console.log(`Venture Bengal is running on port ${port}`);
});

app.use(express.json());
app.use(cors());

require("dotenv").config();




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_ACCESS_KEY}@cluster0.hg5h0d4.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
} );

const packagesCollection = client.db( 'bengalDB' ).collection( 'packages' );

async function run() {
  try {
  
      await client.connect();
      
    app.get( '/packages', async ( req, res ) => {
      const result = await packagesCollection.find().toArray();
      res.send( result );
    } );
    
    app.get( '/packages/details/:id', async ( req, res ) => {
      const id = req.params.id;
      const query = { _id: new ObjectId( id ) };
      const result = await packagesCollection.findOne( query );
      res.send( result );
    })






    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
  }
}
run().catch(console.dir);
