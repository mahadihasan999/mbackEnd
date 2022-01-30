const express = require('express')
const { MongoClient } = require('mongodb');
const cors = require('cors')
const admin = require("firebase-admin");
const ObjectId = require('mongodb').ObjectId;
const { json } = require('express');
const fileUpload = require('express-fileupload');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
var serviceAccount = require("./maliha-tabassum-firebase-adminsdk-m4b6z-8f22573dd8.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)

});

app.use(cors())
app.use(express.json())
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wymqp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//verify token 

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}


async function run() {

    try {
        await client.connect()
        const database = client.db('maliha-tabassum')
        const blogsCollection = database.collection('blogs')
        const booksCollection = database.collection('books')
        const orderCollection = database.collection('orders')
        const reviewCollection = database.collection('review')
        const usersCollection = database.collection('users');

        //Get Blogs API
        app.get('/blogs', async (req, res) => {
            const cursor = blogsCollection.find({})
            const page = req.query.page;
            const size = parseInt(req.query.size)
            let blogs;
            const count = await cursor.count()
            if (page) {
                blogs = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                blogs = await cursor.toArray();
            }

            res.send({
                count,
                blogs

            })
        })

        //Get Book API
        app.get('/books', async (req, res) => {
            const cursor = booksCollection.find({})
            const page = req.query.page;
            const size = parseInt(req.query.size)
            let books;
            const count = await cursor.count()
            if (page) {
                books = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                books = await cursor.toArray();
            }

            res.send({
                count,
                books

            })
        })


        app.post('/blogs', async (req, res) => {
            const title = req.body.title;
            const excerpt = req.body.excerpt;
            const author = req.body.author;
            const date = req.body.date;
            const img = req.body.img;
            const sellLink = req.body.sellLink;
            const blogs = {
                title,
                excerpt,
                author,
                img,
                date,
                sellLink,

            }
            const result = await blogsCollection.insertOne(blogs);
            console.log(result)
            res.send(result)
        })


        //added book from user
        app.post('/books', async (req, res) => {
            const title = req.body.title;
            const excerpt = req.body.excerpt;
            const author = req.body.author;
            const date = req.body.date;
            const img = req.body.img;
            const sellLink = req.body.sellLink;
            const books = {
                title,
                excerpt,
                author,
                img,
                date,
                sellLink,

            }
            const result = await booksCollection.insertOne(books);
            console.log(result)
            res.send(result)
        })


        app.get('/orders', verifyToken, async (req, res) => {

            const cursor = orderCollection.find({})
            const page = req.query.page;
            const size = parseInt(req.query.size)
            let orders;
            const count = await cursor.count()
            if (page) {
                orders = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                orders = await cursor.toArray();
            }

            res.send({
                count,
                orders

            })
        })

        //get review from backEnd to show Review page
        app.get('/review', async (req, res) => {

            const cursor = reviewCollection.find({})
            const page = req.query.page;
            const size = parseInt(req.query.size)
            let reviews;
            const count = await cursor.count()
            if (page) {
                reviews = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                reviews = await cursor.toArray();
            }

            res.send({
                count,
                reviews

            })
        })

        //add order data
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })

        //add review data from UI(AddReview)
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result)
        })

        //update data
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    bikeName: updatedUser.bikeName,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    address: updatedUser.address,
                    phone: updatedUser.phone,

                },

            };
            const result = await orderCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        //delete data
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            };
            const result = await orderCollection.deleteOne(query)
            console.log('deleting user with id', id);
            res.json(result)

        })



        // user section
        //================================================
        // kjkkkkkkkkkkkkkkk


        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);

            res.json(result);
        });



        app.put('/users/admin', verifyToken, async (req, res) => {
            console.log('admin hitted')
            const user = req.body;
            console.log('request email', user)
            const requester = req.decodedEmail;
            console.log('Admin Email:', requester)
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    console.log(updateDoc)
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                    console.log(result)
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        })

    }
    finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('malihatabassum')
});

app.listen(port, () => {
    console.log('Server running at port', port)
})

