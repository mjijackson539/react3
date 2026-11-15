import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "./CartContext";
export default function ProductCard(props) {
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  const finalPrice = Math.round(props.price * (100 - props.discount)) / 100;
  function handleAdd() {
    addToCart({ id: props.id, name: props.name, price: finalPrice });
    navigate("/cart");
  }
  return (
    <div className="productcard">
      <h2>
        <Link to={`/product/${props.id}`}>{props.name}</Link>
      </h2>
      <p>{props.description}</p>
      <p>Длительность: {props.duration} мин.</p>
      {props.discount > 0 && <p>Скидка: {props.discount}%</p>}
      <p>
        Цена: {finalPrice} ₽ {props.discount > 0 && <s>{props.price} ₽</s>}
      </p>
      <button onClick={handleAdd}>В корзину</button>
    </div>
  );
}
