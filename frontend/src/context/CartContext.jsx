// The customer's orders, and the "cart" = reserved items waiting for payment.
// Adding to the cart reserves 1 unit on the server, so it is really held for this customer until the timer runs out.
//   const { cart, orderFor, reserve, remove } = useCart();
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useInterval } from '../hooks';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false); // first load finished (so an empty cart really is empty)
  // Re-check timed-out reservations every few seconds (not every second: the whole app reads this context)
  const [now, setNow] = useState(Date.now());
  useInterval(() => setNow(Date.now()), 5000);
  const isCustomer = user && !isAdmin;

  const refresh = useCallback(async () => {
    if (!isCustomer) {
      setOrders([]);
      return setLoaded(true);
    }
    try {
      setOrders((await api('/me/orders')).orders);
    } catch {}
    setLoaded(true);
  }, [isCustomer]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  useInterval(refresh, isCustomer ? 20000 : null);

  // Reserved and not timed out yet (the server releases expired ones within a few seconds)
  const cart = useMemo(() => orders.filter((o) => o.status === 'reserved' && new Date(o.expiresAt) > now), [orders, now]);

  // itemId -> my active order (in the cart, or already bought)
  const byItem = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (o.status === 'confirmed' || (o.status === 'reserved' && new Date(o.expiresAt) > now)) map[o.itemId] = o;
    });
    return map;
  }, [orders, now]);
  const orderFor = useCallback((itemId) => byItem[itemId], [byItem]);

  // Reserve 1 unit. Returns the order, or null when it did not work (a message has been shown).
  async function reserve(itemId, variant = '') {
    if (!user) {
      toast('Please log in to buy.', 'info');
      navigate('/login?next=' + encodeURIComponent(location.pathname + location.search));
      return null;
    }
    try {
      const { order } = await api('/purchase/reserve', { method: 'POST', body: { itemId, variant } });
      setOrders((list) => [order, ...list]);
      return order;
    } catch (err) {
      toast(err.message, 'error');
      if (err.code === 'PROFILE_INCOMPLETE') navigate('/profile?complete=1');
      refresh();
      return null;
    }
  }

  async function remove(orderId) {
    try {
      await api(`/purchase/${orderId}/cancel`, { method: 'POST' });
      toast('Removed from your cart. The item was released.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
    await refresh();
  }

  return <CartContext.Provider value={{ orders, cart, loaded, orderFor, reserve, remove, refresh }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
