// Saved items (the heart). Kept in this browser only, per account.
//   const { items, has, toggle } = useWishlist();
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const key = 'wishlist:' + (user?._id || 'guest');
  const [items, setItems] = useState(() => read(key));

  useEffect(() => {
    setItems(read(key));
  }, [key]);

  function save(next) {
    setItems(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }

  const has = (id) => items.some((i) => i._id === id);

  // A small copy of the item is saved so the wishlist page can show it without asking the server
  function toggle(item) {
    if (has(item._id)) {
      save(items.filter((i) => i._id !== item._id));
      toast('Removed from your wishlist.', 'info');
    } else {
      const { _id, name, brand, image, price, originalPrice, eventId } = item;
      save([{ _id, name, brand, image, price, originalPrice, eventId }, ...items]);
      toast('Saved to your wishlist.', 'success');
    }
  }

  return <WishlistContext.Provider value={{ items, has, toggle }}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
