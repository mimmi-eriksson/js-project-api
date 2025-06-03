import cors from "cors"
import express from "express"
import listEndpoints from "express-list-endpoints"
import mongoose from "mongoose"

import data from "./data.json"

// setting up database connection
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts"
mongoose.connect(mongoUrl)

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

// creating a schema and model for messages in database
const thoughtSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 140
  },
  hearts: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: {
    type: [String],
    required: true,
    enum: ["travel", "food", "family", "friends", "humor", "nature", "wellness", "home", "entertainment", "work", "other"],
    default: "other"
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
})
const Thought = mongoose.model("Thought", thoughtSchema)

// seeding data to database
if (process.env.RESET_DATABASE) {
  const seedDatabase = async () => {
    await Thought.deleteMany({})
    data.forEach(thought => {
      new Thought(thought).save()
    })
  }
  seedDatabase()
}

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())

// endpoint for documentation of the API
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app)
  res.json({
    message: "Welcome to the Happy Thoughts API",
    endpoints: endpoints
  })
})

// endpoint to get all thoughts
// query params: ?page=1, ?limit=20, ?sort=hearts, ?tag=travel
app.get("/thoughts", (req, res) => {
  const page = req.query.page || 1
  const limit = req.query.limit || 10
  const tag = req.query.tag
  const sort = req.query.sort
  let thoughts = data
  // filter thoughts
  // filter on tag 
  if (tag) {
    thoughts = thoughts.filter(thought =>
      thought.tags.some(word => word.toLowerCase() === tag.toLowerCase())
    )
  }
  // sort thoughts 
  // sort on hearts
  if (sort === "likes") {
    thoughts = thoughts.sort((a, b) => b.hearts - a.hearts)
  }
  // sort on createdAt
  if (sort === "time") {
    thoughts = thoughts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
  // paginate results
  thoughts = thoughts.slice((page - 1) * limit, page * limit)
  res.json(thoughts)
})

// endpoint to get most liked messages
app.get("/thoughts/popular", (req, res) => {
  const page = req.query.page || 1
  const limit = req.query.limit || 10
  // sort on most hearts
  let popularThoughts = data.sort((a, b) => b.hearts - a.hearts)
  // paginate results
  popularThoughts = popularThoughts.slice((page - 1) * limit, page * limit)
  res.json(popularThoughts)
})

// endpoint to get most recent messages
app.get("/thoughts/recent", (req, res) => {
  const page = req.query.page || 1
  const limit = req.query.limit || 10
  // sort on most hearts
  let recentThoughts = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  // paginate results
  recentThoughts = recentThoughts.slice((page - 1) * limit, page * limit)
  res.json(recentThoughts)
})

// endpoint to get one thought by id
app.get("/thoughts/:id", (req, res) => {
  const thought = data.filter(thought => thought._id === req.params.id)
  // if id doesn't exist - return not found
  if (!thought || thought.length === 0) {
    return res.status(404).json({ error: "Thought not found!" })
  }
  res.json(thought)
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})


// endpoint ideas:

// GET /messages/recent
// shortcut for newest messages (e.g., limit=10 and sorted by createdAt)

// GET /messages/popular
// Returns messages sorted by most hearts

// GET /messages/search
// Query param: ?q=coffee - search messages by keyword

// tags
// GET /tags - Returns the list of available tags/categories



// POST /messages
// Creates a new message.
// Body: { message: "string", tags: ["tag1", "tag2"] }

// DELETE /messages/:id
// Deletes a specific message.

// PATCH /messages/:id
// Allows editing a message (like fixing a typo).