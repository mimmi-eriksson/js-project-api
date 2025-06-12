import mongoose from "mongoose"

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

export const Thought = mongoose.model("Thought", thoughtSchema)