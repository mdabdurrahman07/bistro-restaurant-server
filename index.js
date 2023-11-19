const express = require('express')
const cors = require('cors')
const app = express()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 8000
require('dotenv').config()

// middleware 
app.use(express.json())
app.use(cors())





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.abtiefd.mongodb.net/?retryWrites=true&w=majority`;



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
    const BistroBossCollection = client.db('BistroBossDB').collection('Menu')
    const BistroBossCartCollection = client.db('BistroBossDB').collection('Cart')
    const BistroBossUserCollection = client.db('BistroBossDB').collection('User')

    // JWT

    app.post('/jwt' , async (req , res)  => {
      const  user = req.body 
      const token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET , {expiresIn : '1h'})
      res.send({ token })
    })
    // middleware
    const verifyToken = (req , res, next) => {
      
      if(!req.headers.authorized){
      return   res.status(401).send({message : "Unauthorized Access"})
      }
      const token = req.headers.authorized.split(' ')[1]
      jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err , decode) => {
        if(err){
          return   res.status(401).send({message : "Unauthorized Access"})
        }
        req.decoded = decode
        next()
      })
    }

    // verifying admin after verifyToken

    const VerifyAdmin = async (req , res , next) => {
      const email = req.decoded?.email;
      const query = {email : email};
      const user = await BistroBossUserCollection.findOne(query);
      const isAdmin = user?.role === 'Admin';
      if(!isAdmin){
        return   res.status(403).send({message : "Forbidden Access"})
      }
      next()
    }

    // getting MENU all data 

    app.post('/menu' , verifyToken , VerifyAdmin , async (req , res ) => {
      const items = req.body
      const result = await BistroBossCollection.insertOne(items)
      res.send(result)
    })
    app.get('/menu' , async (req , res)=> {
        const result =  await BistroBossCollection.find().toArray()
        res.send(result)
    })
    // dynamic getting
    app.get('/menu/:id' , async (req , res)=> {
      const id = req.params.id;
      const query = {_id : id}
      const result =  await BistroBossCollection.findOne(query)
      res.send(result)
  })
  // patch menu 
  app.patch('/menu/:id' , async (req , res ) => {
    const Item = req.body
    const id = req.params.id;
    const query = { _id : new ObjectId(id)};
    const UpdatedDoc = {
      $set : {
        name : Item.name,
        category : Item.category,
        price : Item.price,
        recipe : Item.recipe,
        image : Item.image
      }
      
    }
    const result = await BistroBossCollection.updateOne(query , UpdatedDoc)
    res.send(result);
  })

    app.delete('/menu/:id' ,verifyToken , VerifyAdmin  , async ( req , res ) => {
      const id = req.params.id;
      const query = { _id : new ObjectId(id)};
      const result = await BistroBossCollection.deleteOne(query);
      res.send(result);
    })
    // cart collection 
    app.post('/cart' , async (req , res)=> {
      const data = req.body
      const result = await BistroBossCartCollection.insertOne(data)
      res.send(result)
    })

    // get cart
    app.get('/cart' , async (req , res)=> {
      const email = req.query.userEmail
      const query = {userEmail : email}
      const result =  await BistroBossCartCollection.find(query).toArray()
      res.send(result)
  })

  app.delete('/cart/:id' , async (req , res)=>{
    const id = req.params.id;
    const filter = { _id : new ObjectId(id)}
    const result = await BistroBossCartCollection.deleteOne(filter)
    res.send(result)
  } )
  // MANAGE ADMIN && USERS APIS

  // post user info
   app.post('/users' , async (req , res) => {
    const user = req.body;
    const query = {email : user.email}
    const existingUser = await BistroBossUserCollection.findOne(query)
    if(existingUser){
      return res.send({message : 'user already exists'})
    }
    const  result = BistroBossUserCollection.insertOne(user)
    res.send(result)
   })
  //  GETTING ALL USERS
   app.get('/users' ,  verifyToken,  VerifyAdmin, async (req , res) => {
    const result = await BistroBossUserCollection.find().toArray()
    res.send(result)
   })
   app.get('/users/admin/:email' , verifyToken , async (req , res) => {
    const email = req.params.email
    if(email !== req.decoded.email)
    return   res.status(403).send({message : "Unauthorized Access"})
  const query = {email : email}
  const result = await BistroBossUserCollection.findOne(query)
  let admin = false
  if(result){
    admin = result.role === "Admin"

  }
  res.send({ admin })
   })
  // DELETING USERS
  app.delete('/users/:id' , async (req , res)=>{
    const id = req.params.id;
    const filter = { _id : new ObjectId(id)}
    const result = await BistroBossUserCollection.deleteOne(filter)
    res.send(result)
  })
  // admin patch 

  app.patch('/users/admin/:id' , async (req , res) => {
    const id = req.params.id
    const filter = { _id : new ObjectId(id)}
    const updatedAdmin = {
    $set :  {
        role : 'Admin'
      }
    }
    const result = await BistroBossUserCollection.updateOne(filter , updatedAdmin)
    res.send(result)
  })



  
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //  
  }
}
run().catch(console.dir);


app.get('/' ,  async(req , res) => {
    res.send('Bistro Boss Server Is Running')
} )

app.listen(port , ()=>{
    console.log(`The port is running on ${port}`)
})



