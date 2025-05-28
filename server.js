import cors from "cors"
import express from "express"
import listEndpoints from "express-list-endpoints"
import data from "./data.json"

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

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
app.get("/thoughts", (req, res) => {
  const page = req.query.page || 1
  const limit = req.query.limit || 10
  const tag = req.query.tag
  const sort = req.query.sort
  // filter thoughts
  // filter on: tags, 
  let filteredThoughts = data
  if (tag) {
    filteredThoughts = filteredThoughts.filter(thought =>
      thought.tags.some(word => word.toLowerCase() === tag.toLowerCase())
    )
  }
  // sort thoughts 
  // sort on: createdAt, hearts,  

  // paginate results
  const paginatedThoughts = filteredThoughts.slice((page - 1) * limit, page * limit)
  res.json(paginatedThoughts)
})

// endpoint to get one thought
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

// GET /messages
// Returns all messages (optionally paginated).
// Query params: ?page=1&limit=20, ?sort=hearts, ?tag=travel

// GET /messages/recent
// shortcut for newest messages (e.g., limit=10 and sorted by createdAt)

// GET /messages/popular
// Returns messages sorted by most hearts or engagement.

// GET /messages/search
// Query param: ?q=coffee – search messages by keyword (basic or fuzzy).

// tags
// GET /tags - Returns the list of available tags/categories



// POST /messages
// Creates a new message.
// Body: { message: "string", tags: ["tag1", "tag2"] }

// DELETE /messages/:id
// Deletes a specific message.

// PATCH /messages/:id
// Allows editing a message (like fixing a typo).