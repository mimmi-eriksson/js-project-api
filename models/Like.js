import mongoose from "mongoose"

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  thought: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Thought",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Ensure that a user can only like a thought once
likeSchema.index({ user: 1, thought: 1 }, { unique: true })

export const Like = mongoose.model("Like", likeSchema)