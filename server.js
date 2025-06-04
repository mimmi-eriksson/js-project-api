import cors from "cors"
import express from "express"
import listEndpoints from "express-list-endpoints"
import mongoose from "mongoose"

// import data from "./data.json"

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
// if (process.env.RESET_DATABASE) {
//   const seedDatabase = async () => {
//     await Thought.deleteMany({})
//     data.forEach(thought => {
//       new Thought(thought).save()
//     })
//   }
//   seedDatabase()
// }

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
app.get("/thoughts", async (req, res) => {
  const page = req.query.page || 1
  const limit = req.query.limit || 10
  const tag = req.query.tag
  const sort = req.query.sort || "time" // sort on most recent by default

  const query = {}
  const sortOptions = {}
  if (tag) {
    query.tags = tag
  }
  if (sort === "likes") {
    sortOptions.hearts = -1
  }
  if (sort === "time") {
    sortOptions.createdAt = -1
  }

  try {
    const filteredThoughts = await Thought.find(query).sort(sortOptions).skip((page - 1) * limit).limit(limit)

    if (filteredThoughts.length === 0) {
      return res.status(404).json({
        success: false,
        response: [],
        message: "No thoughts found on that query. Try another one."
      })
    }
    res.status(200).json({
      success: true,
      response: filteredThoughts,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      response: error,
      message: "Failed to fetch thoughts."
    })
  }
})

// endpoint to get most liked messages
app.get("/thoughts/popular", async (req, res) => {
  const page = req.query.page || 1
  const limit = req.query.limit || 10
  const tag = req.query.tag

  const query = {}
  if (tag) {
    query.tags = tag
  }

  try {
    const popularThoughts = await Thought.find(query).sort({ hearts: -1 }).skip((page - 1) * limit).limit(limit)

    if (popularThoughts.length === 0) {
      return res.status(404).json({
        success: false,
        response: [],
        message: "No thoughts found on that query. Try another one."
      })
    }
    res.status(200).json({
      success: true,
      response: popularThoughts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error,
      message: "Failed to fetch popular thoughts."
    })
  }
})

// endpoint to get most recent messages
app.get("/thoughts/recent", async (req, res) => {
  const page = req.query.page || 1
  const limit = req.query.limit || 10
  const tag = req.query.tag

  const query = {}
  if (tag) {
    query.tags = tag
  }

  try {
    const recentThoughts = await Thought.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)

    if (recentThoughts.length === 0) {
      return res.status(404).json({
        success: false,
        response: [],
        message: "No thoughts found on that query. Try another one."
      })
    }
    res.status(200).json({
      success: true,
      response: recentThoughts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error,
      message: "Failed to fetch recent thoughts."
    })
  }
})

// endpoint to get one thought by id
app.get("/thoughts/:id", async (req, res) => {
  const { id } = req.params

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        sucess: false,
        response: null,
        message: "Invalid ID format."
      })
    }

    const thought = await Thought.findById(id)
    if (!thought) {
      return res.status(404).json({
        success: false,
        response: null,
        message: "Thought not found!"
      })
    }

    res.status(200).json({
      success: true,
      response: thought
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      response: error,
      message: "Failed to fetch thought."
    })
  }
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