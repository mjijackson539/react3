import { useEffect, useState } from "react";
import { request, adminRequest, getCategories, getServices } from "./api";
export default function Dashboard() {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [allCoupons, setAllCoupons] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [service, setService] = useState({
    name: "",
    description: "",
    duration_minutes: "",
    price: "",
    category_id: "",
  });
  const [userId, setUserId] = useState("");
  const [couponId, setCouponId] = useState("");
  const [discounts, setDiscounts] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    try {
      if (!user) return;
      const my = await request("/my-coupons", {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      });
      setCoupons(my);
      if (user.role === "admin") {
        const [u, c, s, cat] = await Promise.all([
          adminRequest("/users"),
          adminRequest("/coupons"),
          getServices(),
          getCategories(),
        ]);
        setUsers(u);
        setAllCoupons(c);
        setServices(s);
        setCategories(cat);
      }
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function run(fn) {
    setError("");
    setMessage("");
    try {
      await fn();
      setMessage("Изменения сохранены");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  if (!user)
    return (
      <p>
        Для доступа к личному кабинету необходимо <a href="/login">войти</a>.
      </p>
    );
  return (
    <div>
      <h1>Личный кабинет</h1>
      <p>
        Вы вошли как {user.name} ({user.role})
      </p>
      <h3>Мои купоны</h3>
      {coupons.length ? (
        coupons.map((c) => (
          <p key={c.coupon_id}>
            {c.name}: {c.discount_percent}%
          </p>
        ))
      ) : (
        <p>Купоны не назначены</p>
      )}
      {error && <p className="error">Ошибка: {error}</p>}
      {message && <p>{message}</p>}
      {user.role === "admin" && (
        <div className="admin">
          <h2>Администратор</h2>
          <h3>Добавить категорию</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() =>
                adminRequest("/categories", "POST", { name: categoryName }),
              );
              setCategoryName("");
            }}
          >
            <input
              placeholder="Название категории"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <button>Добавить</button>
          </form>
          <h3>Добавить услугу</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => adminRequest("/services", "POST", service));
            }}
          >
            <input
              placeholder="Название"
              required
              value={service.name}
              onChange={(e) => setService({ ...service, name: e.target.value })}
            />
            <input
              placeholder="Описание"
              required
              value={service.description}
              onChange={(e) =>
                setService({ ...service, description: e.target.value })
              }
            />
            <input
              type="number"
              min="1"
              placeholder="Длительность (мин)"
              required
              value={service.duration_minutes}
              onChange={(e) =>
                setService({ ...service, duration_minutes: e.target.value })
              }
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Цена"
              required
              value={service.price}
              onChange={(e) =>
                setService({ ...service, price: e.target.value })
              }
            />
            <select
              required
              value={service.category_id}
              onChange={(e) =>
                setService({ ...service, category_id: e.target.value })
              }
            >
              <option value="">Категория</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button>Добавить</button>
          </form>
          <h3>Общие скидки на услуги</h3>
          {services.map((s) => (
            <div key={s.service_id}>
              {s.name} (сейчас {s.discount_percent}%){" "}
              <input
                aria-label={`Скидка для ${s.name}`}
                type="number"
                min="0"
                max="100"
                value={discounts[s.service_id] ?? s.discount_percent}
                onChange={(e) =>
                  setDiscounts({ ...discounts, [s.service_id]: e.target.value })
                }
              />
              <button
                onClick={() =>
                  run(() =>
                    adminRequest(`/services/${s.service_id}/discount`, "PUT", {
                      discount_percent: Number(
                        discounts[s.service_id] ?? s.discount_percent,
                      ),
                    }),
                  )
                }
              >
                Сохранить скидку
              </button>
            </div>
          ))}
          <h3>Назначить персональный купон</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() =>
                adminRequest("/user-coupons", "POST", {
                  user_id: userId,
                  coupon_id: couponId,
                }),
              );
            }}
          >
            <select
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">Пользователь</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <select
              required
              value={couponId}
              onChange={(e) => setCouponId(e.target.value)}
            >
              <option value="">Купон</option>
              {allCoupons.map((c) => (
                <option key={c.coupon_id} value={c.coupon_id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button>Выдать купон</button>
          </form>
        </div>
      )}
    </div>
  );
}
