import { Route, Routes } from 'react-router-dom';
import Layout from './layouts/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalogue from './pages/Catalogue';
import BookDetails from './pages/BookDetails';
import Dashboard from './pages/Dashboard';
import MyBorrowings from './pages/MyBorrowings';
import { Empty } from './components/ui';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import BookManagement from './pages/admin/BookManagement';
import MemberManagement from './pages/admin/MemberManagement';
import Transactions from './pages/admin/Transactions';
import Reports from './pages/admin/Reports';
export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<Landing />} /><Route path="login" element={<Login />} /><Route path="register" element={<Register />} />
    <Route path="books" element={<Catalogue />} /><Route path="books/:id" element={<BookDetails />} />
    <Route path="dashboard" element={<ProtectedRoute role="MEMBER"><Dashboard /></ProtectedRoute>} />
    <Route path="my-borrowings" element={<ProtectedRoute role="MEMBER"><MyBorrowings /></ProtectedRoute>} />
    <Route path="admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
      <Route index element={<AdminDashboard />} /><Route path="books" element={<BookManagement />} /><Route path="members" element={<MemberManagement />} />
      <Route path="borrowings" element={<Transactions />} /><Route path="reports" element={<Reports />} /></Route>
    <Route path="*" element={<Empty text="Page not found." />} />
  </Route></Routes>;
}
