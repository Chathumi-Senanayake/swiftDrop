import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import { formatDate } from '../../utils';

export default function Users() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState(''); // search text, applied 300ms after typing stops
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ users: [], page: 1, pages: 1, total: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setData(await api(`/admin/users?page=${page}&search=${encodeURIComponent(query)}`));
    } catch (err) {
      toast(err.message, 'error');
    }
  }, [page, query, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function setActive(id, active) {
    const question = active ? 'Re-activate this account?' : 'Deactivate this customer? They will be logged out and unable to log in.';
    if (!window.confirm(question)) return;
    try {
      await api('/admin/users/' + id, { method: 'PATCH', body: { active } });
      toast(active ? 'Account activated.' : 'Account deactivated.', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <AdminLayout>
      <div className="card card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          <h1 className="page-title">Users</h1>
          <input placeholder="Search users by name or email…" style={{ maxWidth: 300 }} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr>
            </thead>
            <tbody>
              {data.users.length === 0 && (
                <tr><td colSpan={6} className="empty">No users found.</td></tr>
              )}
              {data.users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                  <td>
                    <span className={'badge badge-' + (u.active ? 'active' : 'inactive')}>{u.active ? 'Active' : 'Deactivated'}</span>
                  </td>
                  <td className="muted small">{formatDate(u.createdAt)}</td>
                  <td>
                    {u.role === 'admin' ? (
                      <span className="muted small">—</span>
                    ) : u.active ? (
                      <button className="btn btn-danger btn-sm" onClick={() => setActive(u._id, false)}>Deactivate</button>
                    ) : (
                      <button className="btn btn-success btn-sm" onClick={() => setActive(u._id, true)}>Activate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="muted small">Page {data.page} of {data.pages} · {data.total} users</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      </div>
    </AdminLayout>
  );
}
