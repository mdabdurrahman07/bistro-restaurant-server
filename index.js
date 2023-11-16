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


    // getting MENU all data 
    app.get('/menu' , async (req , res)=> {
        const result =  await BistroBossCollection.find().toArray()
        res.send(result)
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
   app.get('/users' , async (req , res) => {
    const result = await BistroBossUserCollection.find().toArray()
    res.send(result)
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



