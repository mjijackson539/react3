
import { useContext, useEffect, useState } from 'react';
import { CartContext } from './CartContext';
import { getMyCoupons } from './api';

export default function Cart() {
  const { cart, addToCart, removeFromCart } = useContext(CartContext);

  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [error, setError] = useState('');

  const grouped = cart.reduce((result, item) => {
    const existing = result.find(x => x.id === item.id);

    if (existing) {
      existing.quantity++;
    } else {
      result.push({ ...item, quantity: 1 });
    }

    return result;
  }, []);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price), 0
  );

  useEffect(() => {
    if (!sessionStorage.getItem('token')) return;

    getMyCoupons()
      .then(data => setCoupons(data))
      .catch(e => setError(e.message));
  }, []);

  const coupon = coupons.find(
    c => String(c.coupon_id) === selectedCoupon
  );

  const discount = coupon ? Number(coupon.discount_percent) : 0;

  const finalTotal = total * (1 - discount / 100);

  return (
    <div>
      <h2>Корзина</h2>

      {grouped.length === 0 ? (
        <p>Корзина пуста</p>
      ) : (
        <ul>
          {grouped.map(item => (
            <li key={item.id} style={{ marginBottom: '10px' }}>
              {item.name} — {item.price} ₽ × {item.quantity}
              {' = '}{item.price * item.quantity} ₽{' '}

              <button onClick={() => addToCart(item)}>
                Ещё один
              </button>{' '}

              <button onClick={() =>
                removeFromCart(cart.findIndex(x => x.id === item.id))
              }>
                Удалить один
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3>Итого: {total} ₽</h3>

      {coupons.length > 0 && cart.length > 0 && (
        <div>
          <h3>Персональная скидка</h3>

          <select
            value={selectedCoupon}
            onChange={e => setSelectedCoupon(e.target.value)}
          >
            <option value="">Без купона</option>

            {coupons.map(c => (
              <option key={c.coupon_id} value={c.coupon_id}>
                {c.name} — {c.discount_percent}%
              </option>
            ))}
          </select>

          {coupon && (
            <>
              <p>Скидка: {discount}%</p>
              <h3>К оплате: {finalTotal.toFixed(2)} ₽</h3>
            </>
          )}
        </div>
      )}

      {error && <p className="error">Ошибка: {error}</p>}
    </div>
  );
}
