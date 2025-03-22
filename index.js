const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Task Schema
const Task = mongoose.model("Task", new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['open', 'in-progress', 'completed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  createdDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
}));

// Create a new task
app.post("/tasks", async (req, res) => {
  console.log(req.body);
  const { title, description, status, priority, dueDate } = req.body;
  const newTask = new Task({ title, description, status, priority, dueDate });
  try {
    await newTask.save();
    res.status(201).json(newTask);
    console.log("New task added successfully");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
    console.log("Retreived all tasks successfully");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update task status
app.put("/tasks/:id", async (req, res) => {
  const { status,title,priority } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { status,title,priority }, { new: true });
    res.status(200).json(task);
    console.log("Updated task successfully");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk update task status
app.put("/tasks/bulk-update", async (req, res) => {
  const { taskIds, status } = req.body;
  try {
    const updatedTasks = await Task.updateMany(
      { _id: { $in: taskIds } },
      { $set: { status } },
      { new: true }
    );
    res.status(200).json(updatedTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete task
app.delete("/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Task deleted" });
    console.log("Task deleted successfully");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Filter tasks by date range and status
app.get("/tasks/filter", async (req, res) => {
  const { startDate, endDate, status } = req.query;

  const query = {};
  if (status) query.status = status;
  if (startDate) query.createdDate = { $gte: new Date(startDate) };
  if (endDate) query.createdDate = { $lte: new Date(endDate) };

  try {
    const filteredTasks = await Task.find(query);
    res.status(200).json(filteredTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Email notification logic (daily reminder for open tasks)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function sendEmail() {
  Task.find({ status: "open" }).then((tasks) => {
    const taskList = tasks.map(
      (task) => `${task.title} - Priority: ${task.priority} - Due: ${task.dueDate}`
    ).join("\n");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "recipient@example.com", 
      subject: "Daily Task Reminder",
      text: `Here are your open tasks:\n\n${taskList}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  });
}

// Send daily reminder at 8 AM (example)
setInterval(sendEmail, 86400000); // Send every 24 hours

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
