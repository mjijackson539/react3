import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getServices } from "./api";
import ProductCard from "./ProductCard";
export default function Product() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getServices()
      .then((items) =>
        setProduct(items.find((s) => s.service_id === Number(id))),
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);
  if (loading) return <p>Загрузка данных...</p>;
  if (error) return <p>Ошибка: {error}</p>;
  if (!product) return <h2>Услуга не найдена</h2>;
  return (
    <ProductCard
      id={product.service_id}
      name={product.name}
      description={product.description}
      duration={product.duration_minutes}
      price={Number(product.price)}
      discount={product.discount_percent}
    />
  );
}
