const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const csvParser = require("csv-parser");

const app = express();
const port = 8000;
const SECRET_KEY = "my_secret_key";

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "MovieInventory",
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err);
    return;
  }
  console.log("✅ Connected to MySQL successfully!");

  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `;
  connection.query(createUsersTableQuery, (err) => {
    if (err) {
      console.error("❌ Error creating users table:", err);
      return;
    }
    console.log("✅ Table 'users' checked/created!");
  });

  const createMoviesTableQuery = `
    CREATE TABLE IF NOT EXISTS movies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      show_id VARCHAR(255),
      type VARCHAR(255),
      title VARCHAR(255),
      director VARCHAR(255),
      cast TEXT,
      country VARCHAR(255),
      date_added DATE,
      release_year YEAR,
      rating VARCHAR(255),
      duration VARCHAR(255),
      listed_in TEXT,
      description TEXT
    )
  `;
  connection.query(createMoviesTableQuery, (err) => {
    if (err) {
      console.error("❌ Error creating movies table:", err);
      return;
    }
    console.log("✅ Table 'movies' checked/created!");

    // Only insert CSV data if table is empty
    const checkIfMoviesExist = `SELECT COUNT(*) as count FROM movies`;
    connection.query(checkIfMoviesExist, (err, results) => {
      if (err) {
        console.error("❌ Error checking movie count:", err);
        return;
      }
      const movieCount = results[0].count;
      if (movieCount === 0) {
        console.log("📥 No movies found. Inserting CSV data...");
        insertCSVData();
      } else {
        console.log(`✅ ${movieCount} movies already in database. Skipping CSV import.`);
      }
    });
  });
});

// Insert CSV data
function insertCSVData() {
  const movies = [];
  fs.createReadStream("netflix_titles.csv")
    .pipe(csvParser())
    .on("data", (row) => {
      movies.push(row);
    })
    .on("end", () => {
      if (movies.length > 0) {
        movies.forEach((movie) => {
          const query = `
            INSERT INTO movies 
            (show_id, type, title, director, cast, country, date_added, release_year, rating, duration, listed_in, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          connection.query(
            query,
            [
              movie.show_id,
              movie.type,
              movie.title,
              movie.director,
              movie.cast,
              movie.country,
              movie.date_added,
              movie.release_year,
              movie.rating,
              movie.duration,
              movie.listed_in,
              movie.description,
            ],
            (err) => {
              if (err) console.error("❌ Error inserting movie:", err);
            }
          );
        });
      } else {
        console.log("⚠️ No data found in CSV file.");
      }
    });
}

// Signup
app.post("/signup", (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  connection.query("SELECT * FROM users WHERE email = ? OR username = ?", [email, username], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0) return res.status(400).json({ message: "User already exists." });

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ message: "Password hashing failed" });

      connection.query("INSERT INTO users (email, username, password) VALUES (?, ?, ?)", [email, username, hashedPassword], (err) => {
        if (err) return res.status(500).json({ message: "Signup failed" });
        res.status(201).json({ message: "✅ Signup successful!" });
      });
    });
  });
});

// Signin
app.post("/signin", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  connection.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(401).json({ message: "Invalid credentials." });

    const user = results[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

      const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
      res.status(200).json({ message: "✅ Login successful!", token });
    });
  });
});

// Movies with pagination
app.get("/movies", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const query = `SELECT * FROM movies LIMIT ? OFFSET ?`;
  connection.query(query, [limit, offset], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch movies" });
    res.json(results);
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
