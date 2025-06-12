import cors from "cors"
import express from "express"
import listEndpoints from "express-list-endpoints"
import mongoose from "mongoose"

import userRoutes from "./routes/userRoutes.js"
import thoughtRoutes from "./routes/thoughtRoutes.js"

// import data from "./data.json"

// setting up database connection
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts"
mongoose.connect(mongoUrl)

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

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

// end point routes
app.use("/users", userRoutes);
app.use("/thoughts", thoughtRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

