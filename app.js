const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Create and connect to the SQLite database
const db = new sqlite3.Database(':memory:'); // Use ':memory:' for an in-memory database, or 'example.db' for a file-based database

// Create a table
db.serialize(() => {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  )`);
});

// Routes
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Create a new user
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  stmt.run([name, email], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ id: this.lastID, name, email });
  });
  stmt.finalize();
});

// Get all users
app.get('/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a single user by ID
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(row);
  });
});

// Update a user
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const stmt = db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?');
  stmt.run([name, email, id], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ id, name, email });
  });
  stmt.finalize();
});

// Delete a user
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run(id, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  });
  stmt.finalize();
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
