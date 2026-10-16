import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
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
  return (
    <>
      <header>
        <Navbar />
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Logged-in users */}
        <Route path="/events" element={<RequireAuth><Events /></RequireAuth>} />
        <Route path="/events/:id" element={<RequireAuth><EventDetail /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

        {/* Customers only */}
        <Route path="/orders" element={<RequireAuth role="customer"><Orders /></RequireAuth>} />

        {/* Admins only */}
        <Route path="/admin" element={<RequireAuth role="admin"><Dashboard /></RequireAuth>} />
        <Route path="/admin/events/new" element={<RequireAuth role="admin"><EventForm /></RequireAuth>} />
        <Route path="/admin/events/:id/edit" element={<RequireAuth role="admin"><EventForm /></RequireAuth>} />
        <Route path="/admin/deliveries" element={<RequireAuth role="admin"><Deliveries /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth role="admin"><Users /></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
