const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const PORT = process.env.PORT || 3000;

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Database connected!");
}

function checkKey(req, res, next) {
  const key = req.headers["x-api-key"];

  if (!process.env.WEBHOOK_SECRET ||
      key !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.send("Webhook is online!");
});

app.post("/webhook", checkKey, async (req, res) => {
  try {
    const result = await pool.query(
      "INSERT INTO messages (data) VALUES ($1) RETURNING *",
      [req.body]
    );

    res.json({
      success: true,
      message: "Message saved!",
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Database error"
    });
  }
});

app.get("/messages", checkKey, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM messages ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Database error"
    });
  }
});

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error("Startup error:", error);
    process.exit(1);
  });
