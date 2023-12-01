const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const jwt = require( 'jsonwebtoken' );
const cookieParser = require( 'cookie-parser' );
const cors = require("cors");
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Welcome to Venture Bengal server");
});

app.listen(port, () => {
  console.log(`Venture Bengal is running on port ${port}`);
});

app.use( express.json() );
app.use( cookieParser() );

// app.use( cors( {
//   origin: [
//     'https://bengal-venture.web.app/',
//     'https://bengal-venture.firebaseapp.com/',
//     'http://localhost:5173'
  
//   ],
//   credentials: true
// } ) );

const corsOptions ={
  origin:'*', 
  credentials:true,
  optionSuccessStatus:200,
}
app.use( cors( corsOptions ) );
module.exports = app;

const logger = ( req, res, next ) => {
  
  next()
}

const verify = ( req, res, next ) => {
  const token = req.cookies?.token;
  if ( !token ) {
    return res.status(401).send({message:"unauthorized access"})
  }
  jwt.verify( token, process.env.ACCESS_TOKEN_SECRET_KEY, ( err, decoded ) => {
    if ( err ) {
      return res.status( 401 ).send( { message: "unauthorized access" } )
    }
    req.user = decoded
    next();
  } );
}

require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_ACCESS_KEY}@cluster0.hg5h0d4.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const packagesCollection = client.db("bengalDB").collection("packages");
const guidesCollection = client.db("bengalDB").collection("guides");
const usersCollection = client.db("bengalDB").collection("users");
const storyCollection = client.db("bengalDB").collection("story");
const bookingsCollection = client.db("bengalDB").collection("bookings");

async function run() {
  try {
    await client.connect();

    app.post( '/jwt', async ( req, res ) => {
      const user = req.body;
      const token = jwt.sign( user, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: '1h' } );
      res.cookie( 'token', token, {
        httpOnly: true,
        secure: true,
        sameSite: "none"
      } )
        .send( { success: true } );
    } );

    app.post( '/logout', async ( req, res ) => {
      const user = req.body;
      res.clearCookie('token',{maxAge:0}).send({success:true})
    })
    

    app.post("/packages", async (req, res) => {
      const package = req.body;
      const result = await packagesCollection.insertOne(package);
      res.send(result);
    });
    app.get("/packages", async (req, res) => {
      const result = await packagesCollection.find().toArray();
      res.send(result);
    });

    app.get("/packages/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await packagesCollection.findOne(query);
      res.send(result);
    });

    app.get("/guides", async (req, res) => {
      const result = await guidesCollection.find().toArray();
      res.send(result);
    });

    app.get("/story", async (req, res) => {
      const result = await storyCollection.find().toArray();
      res.send(result);
    });

    // user related api

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const exsistingUser = await usersCollection.findOne(query);
      if (exsistingUser) {
        return res.send({ message: "user already exist" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    // get user api

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/role", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await usersCollection.findOne(filter);
      res.send(result);
    });

    app.patch("/users/role/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/role/guide/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { role: "guide" },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // booking related api

    app.post("/bookings", async (req, res) => {
      const bookingData = req.body;
      const result = await bookingsCollection.insertOne(bookingData);
      res.send(result);
    } );
    
    // booking status api
    app.patch("/bookings/accept/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { status: "Accepted" },
      };
      const result = await bookingsCollection.updateOne(filter, updateDoc);
      res.send(result);
    } );
    
    app.patch("/bookings/reject/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { status: "Rejected" },
      };
      const result = await bookingsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // get bookings api

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      // if ( req.user.email !== req.query.email ) {
      //   return res.status(403).send({message:"Forbidden access"})
      // }
      const query = { email: email };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/bookings/manage", async (req, res) => {
      const name = req.query.name;
      const filter = {
        selectedGuide:name}
      const result = await bookingsCollection.find( filter ).toArray();
      res.send( result );
    });

    // delete bookings api

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);
