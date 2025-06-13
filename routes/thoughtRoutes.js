import express from "express"
import mongoose from "mongoose"
import { Thought } from "../models/Thought.js"
import { authenticateUser } from "../middleware/authMiddleware.js"

const router = express.Router()

// get all thoughts
router.get("/", async (req, res) => {
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
    const totalCount = await Thought.find(query).countDocuments()
    const thoughts = await Thought.find(query).sort(sortBy).skip((page - 1) * limit).limit(limit)

    if (thoughts.length === 0) {
      return res.status(404).json({
        success: false,
        response: [],
        message: "No thoughts found on that query. Try another one."
      })
    }
    res.status(200).json({
      success: true,
      response: {
        data: thoughts,
        totalCount: totalCount,
        currentPage: page,
        limit: limit,
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error,
      message: "Failed to fetch thoughts."
    })
  }
})

// get most liked messages
router.get("/popular", async (req, res) => {
  const page = req.query.page || 1
  const limit = req.query.limit || 10
  const tag = req.query.tag

  const query = {}
  if (tag) {
    query.tags = tag
  }

  try {
    const totalCount = await Thought.find(query).countDocuments()
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
      response: {
        data: popularThoughts,
        totalCount: totalCount,
        currentPage: page,
        limit: limit,
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error,
      message: "Failed to fetch popular thoughts."
    })
  }
})

// get most recent messages
router.get("/recent", async (req, res) => {
  const page = req.query.page || 1
  const limit = req.query.limit || 10
  const tag = req.query.tag

  const query = {}
  if (tag) {
    query.tags = tag
  }

  try {
    const totalCount = await Thought.find(query).countDocuments()
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
      response: {
        data: recentThoughts,
        totalCount: totalCount,
        currentPage: page,
        limit: limit,
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error,
      message: "Failed to fetch recent thoughts."
    })
  }
})

// get one thought by id
router.get("/:id", async (req, res) => {
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

// post a thought
router.post("/", authenticateUser, async (req, res) => {
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

// delete a thought
router.delete("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params
  const userId = req.user._id

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
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
    console.error("Error in DELETE /thoughts/:id route:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete thought."
    })
  }
})

// edit a thought
router.patch("/:id", authenticateUser, async (req, res) => {
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

// like a thought
router.patch("/:id/like", async (req, res) => {
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

export default router