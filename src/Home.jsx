import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { getServices, getCategories } from "./api";
export default function Home() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [s, c] = await Promise.all([getServices(), getCategories()]);
      setServices(s);
      setCategories(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadData();
  }, []);
  function toggle(id) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((x) => x !== id)
        : [...previous, id],
    );
  }
  return (
    <div>
      <h1>Каталог услуг</h1>
      {loading ? (
        <p>Загрузка данных...</p>
      ) : error ? (
        <div>
          <p>Ошибка: {error}</p>
          <button onClick={loadData}>Попробовать снова</button>
        </div>
      ) : (
        <div className="catalog-layout">
          <aside className="categories">
            <h3>Категории</h3>
            {categories.map((c) => (
              <label key={c.category_id}>
                <input
                  type="checkbox"
                  checked={selected.includes(c.category_id)}
                  onChange={() => toggle(c.category_id)}
                />
                {c.name}
              </label>
            ))}
          </aside>
          <div className="products">
            {services
              .filter(
                (s) =>
                  selected.length === 0 || selected.includes(s.category_id),
              )
              .map((s) => (
                <ProductCard
                  key={s.service_id}
                  id={s.service_id}
                  name={s.name}
                  description={s.description}
                  duration={s.duration_minutes}
                  price={Number(s.price)}
                  discount={s.discount_percent}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
