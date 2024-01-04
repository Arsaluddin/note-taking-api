
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const Note = require('./note.model.js');
const rateLimit = require('express-rate-limit');

const { json } = bodyParser;
const { connect, connection, Schema, model } = mongoose;
const { hash, compare } = bcrypt;
const { sign } = jsonwebtoken;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 100, // limit each IP to 100 requests per windowMs    "test": "echo \"Error: no test specified\" && exit 1"
});

const app = express();
module.exports = app;
app.use(apiLimiter);
// Middleware
app.use(json());

// MongoDB connection


connect('mongodb+srv://arsaluddin134:AxluRXMaNJ7RDJZ9@cluster0.jajb9lk.mongodb.net/');

const db = connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// User Schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = model('User', userSchema);

// Authentication Endpoints
// Create a new user account
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    const savedUser = await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: savedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Log in to an existing user account and receive an access token
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Note Endpoints
// Get a list of all notes for the authenticated user
app.get('/api/notes', async (req, res) => {
  try {
    // Extract user information from the token
    const userId = req.user.userId;
    const notes = await find({ user: userId });
    res.status(200).json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a note by ID for the authenticated user
app.get('/api/notes/:id', async (req, res) => {
  try {
    // Extract user information from the token
    const userId = req.user.userId;
    const note = await findOne({ _id: req.params.id, user: userId });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new note for the authenticated user
app.post('/api/notes', async (req, res) => {
  try {
    // Extract user information from the token
    const userId = req.user.userId;
    const { title, content } = req.body;
    const newNote = new Note({ title, content, user: userId });
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update an existing note by ID for the authenticated user
app.put('/api/notes/:id', async (req, res) => {
  try {
    // Extract user information from the token
    const userId = req.user.userId;
    const { title, content } = req.body;
    const updatedNote = await findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { title, content, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(200).json(updatedNote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a note by ID for the authenticated user
app.delete('/api/notes/:id', async (req, res) => {
  try {
    // Extract user information from the token
    const userId = req.user.userId;
    const deletedNote = await findOneAndDelete({ _id: req.params.id, user: userId });
    if (!deletedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Share a note with another user for the authenticated user
app.post('/api/notes/:id/share', async (req, res) => {
  try {
    // Extract user information from the token
    const userId = req.user.userId;
    const { sharedUserId } = req.body;

    // Check if the note exists and belongs to the user
    const note = await findOne({ _id: req.params.id, user: userId });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if the user to share with exists
    const userToShareWith = await User.findById(sharedUserId);
    if (!userToShareWith) {
      return res.status(404).json({ error: 'User to share with not found' });
    }

    // Add the user to the sharedUsers array in the note
    note.sharedUsers.push(sharedUserId);
    await note.save();

    res.status(200).json({ message: 'Note shared successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Search for notes based on keywords for the authenticated user
app.get('/api/search', async (req, res) => {
  try {
    const userId = req.user.userId;
    const query = req.query.q;

    const notes = await find(
      { user: userId, $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    res.status(200).json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
