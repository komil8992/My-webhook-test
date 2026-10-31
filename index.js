const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const SECRET = process.env.WEBHOOK_SECRET;

async function init() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            message JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `);
}

// بررسی کلید امنیتی
function auth(req, res, next) {
    if (!SECRET || req.headers["x-api-key"] !== SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

// صفحه اصلی
app.get("/", (req, res) => {
    res.send("Webhook is online!");
});

// دریافت و ذخیره پیام
app.post("/webhook", auth, async (req, res) => {
    try {
        const result = await db.query(
            "INSERT INTO messages (message) VALUES ($1) RETURNING *",
            [JSON.stringify(req.body)]
        );

        res.json({
            success: true,
            saved: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// دریافت پیام‌های ذخیره‌شده
app.get("/messages", auth, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM messages ORDER BY id DESC"
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

const PORT = process.env.PORT || 3000;

init().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
        console.log("Webhook started on port " + PORT);
    });
}).catch(console.error);
