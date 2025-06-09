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
    lowercase: true,
    enum: ["travel", "food", "family", "friends", "humor", "nature", "wellness", "home", "entertainment", "work", "other"],
    default: "other"
  },
  createdAt: {
    type: Date,
    default: Date.now
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
// ADD search functionality
app.get("/thoughts", async (req, res) => {
  const page = req.query.page || 1
  const limit = req.query.limit || 10
  const sortBy = req.query.sort_by || "-createdAt" // sort on most recent by default
  const tag = req.query.tag
  const likes = req.query.likes

  const query = {}
  if (tag) {
    query.tags = tag
  }
  if (likes) {
    query.hearts = { $gte: likes }
  }

  try {
    const filteredThoughts = await Thought.find(query).sort(sortBy).skip((page - 1) * limit).limit(limit)

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
    res.status(500).json({
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
    const popularThoughts = await Thought.find(query).sort("-hearts").skip((page - 1) * limit).limit(limit)

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
    const recentThoughts = await Thought.find(query).sort("-createdAt").skip((page - 1) * limit).limit(limit)

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

// endpoint to add a thought
app.post("/thoughts", async (req, res) => {
  const { message, tags } = req.body

  try {
    // validate input
    if (!message || message.length < 5 || message.length > 140) {
      return res.status(400).json({
        success: false,
        response: null,
        message: "Message must be between 5 and 140 characters."
      })
    }

    const newThought = await new Thought({ message, tags }).save()
    if (!newThought) {
      return res.status(400).json({
        success: false,
        response: null,
        message: "Failed to post thought."
      })
    }
    res.status(201).json({
      success: true,
      response: newThought,
      message: "Thought successfully posted!"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error,
      message: "Failed to create thought."
    })
  }
})

// endpoint to delete a thought
app.delete("/thoughts/:id", async (req, res) => {
  const { id } = req.params

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        sucess: false,
        response: null,
        message: "Invalid ID format."
      })
    }
    const thought = await Thought.findByIdAndDelete(id)
    if (!thought) {
      return res.status(404).json({
        success: false,
        response: null,
        message: "Thought not found!"
      })
    }
    res.status(200).json({
      success: true,
      response: thought,
      message: "Thought successfully deleted!"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error,
      message: "Failed to delete thought."
    })
  }
})

// endpoint to edit a thought
app.patch("/thoughts/:id", async (req, res) => {
  const { id } = req.params
  const { message } = req.body

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        sucess: false,
        response: null,
        message: "Invalid ID format."
      })
    }
    if (message.length < 5 || message.length > 140) {
      return res.status(400).json({
        success: false,
        response: null,
        message: "Message must be between 5 and 140 characters."
      })
    }

    const thought = await Thought.findByIdAndUpdate(id, { message }, { new: true, runValidators: true })
    if (!thought) {
      return res.status(404).json({
        success: false,
        response: null,
        message: "Thought not found!"
      })
    }
    res.status(200).json({
      success: true,
      response: thought,
      message: "Thought successfully edited!"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error,
      message: "Failed to edit thought."
    })
  }
})

// endpoint to like a thought
app.patch("/thoughts/:id/like", async (req, res) => {
  const { id } = req.params

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        sucess: false,
        response: null,
        message: "Invalid ID format."
      })
    }
    const thought = await Thought.findByIdAndUpdate(id, { $inc: { hearts: 1 } }, { new: true, runValidators: true })
    if (!thought) {
      return res.status(404).json({
        success: false,
        response: null,
        message: "Thought not found!"
      })
    }
    res.status(200).json({
      success: true,
      response: thought,
      message: "Thought successfully liked!"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error,
      message: "Failed to like thought."
    })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})


// endpoint ideas:

// GET /messages/search
// Query param: ?q=coffee - search messages by keyword

// tags
// GET /tags - Returns the list of available tags/categories

