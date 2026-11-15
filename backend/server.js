const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const { randomBytes } = require("crypto");
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
const sessions = new Map();
function fail(res, error) {
  console.error(error);
  return res.status(500).json({ error: "Ошибка сервера или базы данных" });
}
async function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  const id = sessions.get(token);
  if (!id) return res.status(401).json({ error: "Требуется авторизация" });
  try {
    const result = await pool.query(
      "SELECT r.name FROM users u JOIN roles r ON r.role_id=u.role_id WHERE u.user_id=$1",
      [id],
    );
    if (result.rows[0]?.name !== "admin")
      return res.status(403).json({ error: "Доступ только администратору" });
    next();
  } catch (error) {
    fail(res, error);
  }
}
app.get("/api/services", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT s.*,c.name AS category_name FROM services s JOIN categories c ON c.category_id=s.category_id ORDER BY s.service_id",
    );
    res.json(result.rows);
  } catch (e) {
    fail(res, e);
  }
});
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories ORDER BY category_id",
    );
    res.json(result.rows);
  } catch (e) {
    fail(res, e);
  }
});
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Заполните email и пароль" });
  try {
    const result = await pool.query(
      `SELECT u.user_id,u.name,u.email,r.name AS role FROM users u JOIN roles r ON r.role_id=u.role_id WHERE u.email=$1 AND u.password_hash=crypt($2,u.password_hash)`,
      [email, password],
    );
    if (!result.rows.length)
      return res.status(401).json({ error: "Неверный email или пароль" });
    const user = result.rows[0],
      token = randomBytes(32).toString("hex");
    sessions.set(token, user.user_id);
    res.json({ user, token });
  } catch (e) {
    fail(res, e);
  }
});
app.get("/api/my-coupons", async (req, res) => {
  const id = sessions.get(
    (req.headers.authorization || "").replace(/^Bearer /, ""),
  );
  if (!id) return res.status(401).json({ error: "Требуется авторизация" });
  try {
    const result = await pool.query(
      "SELECT c.* FROM coupons c JOIN user_coupons uc ON uc.coupon_id=c.coupon_id WHERE uc.user_id=$1",
      [id],
    );
    res.json(result.rows);
  } catch (e) {
    fail(res, e);
  }
});
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id,name,email FROM users ORDER BY user_id",
    );
    res.json(result.rows);
  } catch (e) {
    fail(res, e);
  }
});
app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM coupons ORDER BY coupon_id");
    res.json(result.rows);
  } catch (e) {
    fail(res, e);
  }
});
app.post("/api/admin/categories", requireAdmin, async (req, res) => {
  const name = req.body?.name?.trim();
  if (!name)
    return res.status(400).json({ error: "Введите название категории" });
  try {
    const r = await pool.query(
      "INSERT INTO categories(name) VALUES($1) RETURNING *",
      [name],
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === "23505")
      return res.status(400).json({ error: "Категория уже существует" });
    fail(res, e);
  }
});
app.post("/api/admin/services", requireAdmin, async (req, res) => {
  const { category_id, name, description, duration_minutes, price } =
    req.body || {};
  if (
    !category_id ||
    !name?.trim() ||
    !description?.trim() ||
    !(Number(duration_minutes) > 0) ||
    !(Number(price) >= 0) ||
    price === ""
  )
    return res.status(400).json({ error: "Проверьте поля услуги" });
  try {
    const r = await pool.query(
      "INSERT INTO services(category_id,name,description,duration_minutes,price) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [category_id, name, description, duration_minutes, price],
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    fail(res, e);
  }
});
app.put("/api/admin/services/:id/discount", requireAdmin, async (req, res) => {
  const percent = Number(req.body?.discount_percent);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100)
    return res.status(400).json({ error: "Скидка от 0 до 100%" });
  try {
    const r = await pool.query(
      "UPDATE services SET discount_percent=$1 WHERE service_id=$2 RETURNING *",
      [percent, req.params.id],
    );
    if (!r.rows.length)
      return res.status(404).json({ error: "Услуга не найдена" });
    res.json(r.rows[0]);
  } catch (e) {
    fail(res, e);
  }
});
app.post("/api/admin/user-coupons", requireAdmin, async (req, res) => {
  const { user_id, coupon_id } = req.body || {};
  if (!user_id || !coupon_id)
    return res.status(400).json({ error: "Выберите пользователя и купон" });
  try {
    const r = await pool.query(
      "INSERT INTO user_coupons(user_id,coupon_id) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING *",
      [user_id, coupon_id],
    );
    res.json({ success: true, assigned: r.rowCount > 0 });
  } catch (e) {
    fail(res, e);
  }
});
app.get("/api/appointments", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM appointments ORDER BY appointment_date DESC",
    );
    res.json(r.rows);
  } catch (e) {
    fail(res, e);
  }
});
app.listen(PORT, () =>
  console.log(`Сервер запущен на http://localhost:${PORT}`),
);
