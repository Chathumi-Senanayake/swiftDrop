import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TickerBar from './components/TickerBar';
import BackToTop from './components/BackToTop';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import Deals from './pages/Deals';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentResult from './pages/PaymentResult';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Dashboard from './pages/admin/Dashboard';
import EventForm from './pages/admin/EventForm';
import Users from './pages/admin/Users';
import Deliveries from './pages/admin/Deliveries';

export default function App() {
  const { pathname } = useLocation();
  // new page -> start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const bare = pathname === '/login' || pathname === '/register';
  const admin = pathname.startsWith('/admin');

  return (
    <>
      <header>
        {!admin && <TickerBar />}
        <Navbar />
      </header>
      <Routes>
        {/* Anyone can browse */}
        <Route path="/" element={<Home />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/items/:id" element={<Product />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Logged-in users */}
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

        {/* Customers only */}
        <Route path="/cart" element={<RequireAuth role="customer"><Cart /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth role="customer"><Checkout /></RequireAuth>} />
        <Route path="/payment/:id" element={<RequireAuth role="customer"><PaymentResult /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth role="customer"><Orders /></RequireAuth>} />

        {/* Admins only */}
        <Route path="/admin" element={<RequireAuth role="admin"><Dashboard /></RequireAuth>} />
        <Route path="/admin/events/new" element={<RequireAuth role="admin"><EventForm /></RequireAuth>} />
        <Route path="/admin/events/:id/edit" element={<RequireAuth role="admin"><EventForm /></RequireAuth>} />
        <Route path="/admin/deliveries" element={<RequireAuth role="admin"><Deliveries /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth role="admin"><Users /></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      {!bare && !admin && <Footer />}
      <BackToTop />
    </>
  );
}
