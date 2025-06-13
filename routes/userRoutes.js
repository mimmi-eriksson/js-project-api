import express from "express";
import bcrypt from "bcrypt-nodejs";
import { User } from "../models/User.js"

const router = express.Router()

// endpoint to register a new user
router.post("/", async (req, res) => {
  try {
    const { userName, password } = req.body
    // validate input
    if (!userName || !password) {
      return res.status(400).json({
        success: false,
        message: "User name and password are required",
      })
    }
    // validate if userName already exists
    const existingUser = await User.findOne({ userName: userName.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User name already exists",
      })
    }
    // create a new user
    const salt = bcrypt.genSaltSync()
    const user = new User({ userName: userName.toLowerCase(), password: bcrypt.hashSync(password, salt) })
    user.save()

    res.status(200).json({
      success: true,
      message: "User created successfully!",
      response: {
        id: user._id,
        accessToken: user.accessToken
      }
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create user",
      error
    })
  }
})

// endpoint to log in an existing user
router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body
    // validate input
    if (!userName || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      })
    }
    // validate if user exists
    const user = await User.findOne({ userName: userName.toLowerCase() })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }
    // validate password
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(200).json({
        success: true,
        message: "Log in successful!",
        response: {
          id: user._id,
          userName: user.userName,
          accessToken: user.accessToken
        }
      })
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid password",
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to log in",
      error,
    })
  }
})

export default router