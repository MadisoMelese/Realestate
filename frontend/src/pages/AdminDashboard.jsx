import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminProperties,
  fetchAdminTransactions,
  updateUserRole,
  deleteUser,
  deleteAdminProperty,
} from '../redux/slices/adminSlice';
import { getImageUrl } from '../utils/imageUrl';

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  pending:   'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded:  'bg-gray-100 text-gray-700',
};

const roleColors = {
  admin:  'bg-purple-100 text-purple-800',
  seller: 'bg-blue-100 text-blue-800',
  buyer:  'bg-gray-100 text-gray-700',
};

const StatCard = ({ label, value, sub, color = 'text-primary-600' }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
  </div>
);

const Badge = ({ label, colorClass }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
    {label}
  </span>
);

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
      <p className="text-gray-800 font-medium mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md">
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Tab: Overview ────────────────────────────────────────────────────────────
const OverviewTab = ({ stats }) => {
  if (!stats) return null;

  const roleMap = Object.fromEntries((stats.usersByRole || []).map(r => [r._id, r.count]));
  const statusMap = Object.fromEntries((stats.propertiesByStatus || []).map(s => [s._id, s.count]));

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users"       value={stats.totalUsers}       sub={`${roleMap.buyer || 0} buyers · ${roleMap.seller || 0} sellers`} />
        <StatCard label="Total Properties"  value={stats.totalProperties}  sub={`${statusMap.Available || 0} available`} />
        <StatCard label="Total Transactions" value={stats.totalTransactions} sub={`${stats.pendingTransactions} pending`} />
        <StatCard label="Total Revenue"     value={`$${(stats.totalRevenue || 0).toLocaleString()}`} color="text-green-600" sub="from completed sales" />
      </div>

      {/* Transaction breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Completed" value={stats.completedTransactions} color="text-green-600" />
        <StatCard label="Pending"   value={stats.pendingTransactions}   color="text-yellow-600" />
        <StatCard label="Cancelled" value={stats.cancelledTransactions} color="text-red-600" />
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-base font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Property', 'Buyer', 'Seller', 'Amount', 'Type', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(stats.recentTransactions || []).map(tx => (
                <tr key={tx._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{tx.property?.title || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tx.buyer?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tx.seller?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">${(tx.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{tx.type}</td>
                  <td className="px-4 py-3"><Badge label={tx.status} colorClass={statusColors[tx.status] || 'bg-gray-100 text-gray-700'} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Users ───────────────────────────────────────────────────────────────
const UsersTab = () => {
  const dispatch = useDispatch();
  const { users, userTotal, userPage, userTotalPages, loading } = useSelector(s => s.admin);
  const currentUserId = useSelector(s => s.auth.user?._id);

  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null); // { id, name }
  const [roleLoading, setRoleLoading] = useState(null);
  const [feedback, setFeedback] = useState('');

  const load = useCallback((page = 1, q = search) => {
    dispatch(fetchAdminUsers({ page, search: q }));
  }, [dispatch, search]);

  useEffect(() => { load(1); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(1, search);
  };

  const handleRoleChange = async (userId, role) => {
    setRoleLoading(userId);
    try {
      await dispatch(updateUserRole({ userId, role })).unwrap();
      setFeedback('Role updated.');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      setFeedback(err?.message || 'Failed to update role.');
    } finally {
      setRoleLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      await dispatch(deleteUser(confirm.id)).unwrap();
      setFeedback('User deleted.');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      setFeedback(err?.message || 'Failed to delete user.');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div className="space-y-4">
      {confirm && (
        <ConfirmModal
          message={`Delete user "${confirm.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 w-64"
          />
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700">
            Search
          </button>
        </form>
        <p className="text-sm text-gray-500">{userTotal} users total</p>
      </div>

      {feedback && <p className="text-sm text-green-600">{feedback}</p>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {u.profileImage
                          ? <img src={getImageUrl(u.profileImage)} alt={u.name} className="w-full h-full object-cover" />
                          : <span className="text-xs font-semibold text-gray-500">{u.name?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <span className="text-sm font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    {u._id === currentUserId ? (
                      <Badge label={u.role} colorClass={roleColors[u.role]} />
                    ) : (
                      <select
                        value={u.role}
                        disabled={roleLoading === u._id}
                        onChange={e => handleRoleChange(u._id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-primary-500"
                      >
                        <option value="buyer">buyer</option>
                        <option value="seller">seller</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {u._id !== currentUserId && (
                      <button
                        onClick={() => setConfirm({ id: u._id, name: u.name })}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {userTotalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: userTotalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => load(p)}
              className={`px-3 py-1 text-sm rounded-md border ${p === userPage ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Tab: Properties ──────────────────────────────────────────────────────────
const PropertiesTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { properties, propertyTotal, propertyPage, propertyTotalPages, loading } = useSelector(s => s.admin);

  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [feedback, setFeedback] = useState('');

  const load = useCallback((page = 1, q = search) => {
    dispatch(fetchAdminProperties({ page, search: q }));
  }, [dispatch, search]);

  useEffect(() => { load(1); }, []);

  const handleSearch = (e) => { e.preventDefault(); load(1, search); };

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      await dispatch(deleteAdminProperty(confirm.id)).unwrap();
      setFeedback('Property deleted.');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      setFeedback(err?.message || 'Failed to delete property.');
    } finally {
      setConfirm(null);
    }
  };

  const propStatusColors = {
    Available: 'bg-green-100 text-green-800',
    Pending:   'bg-yellow-100 text-yellow-800',
    Sold:      'bg-gray-100 text-gray-700',
    Rented:    'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-4">
      {confirm && (
        <ConfirmModal
          message={`Delete property "${confirm.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or city…"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 w-64"
          />
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700">
            Search
          </button>
        </form>
        <p className="text-sm text-gray-500">{propertyTotal} properties total</p>
      </div>

      {feedback && <p className="text-sm text-green-600">{feedback}</p>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Property', 'Owner', 'Price', 'Type', 'Status', 'Listed', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && properties.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : properties.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No properties found.</td></tr>
              ) : properties.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                        {p.images?.[0] && (
                          <img src={getImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 max-w-[160px] truncate">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.location?.city}, {p.location?.state}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.owner?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">${(p.price || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{p.type}</td>
                  <td className="px-4 py-3"><Badge label={p.status} colorClass={propStatusColors[p.status] || 'bg-gray-100 text-gray-700'} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/properties/${p._id}`)}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setConfirm({ id: p._id, title: p.title })}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {propertyTotalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: propertyTotalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => load(p)}
              className={`px-3 py-1 text-sm rounded-md border ${p === propertyPage ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Tab: Transactions ────────────────────────────────────────────────────────
const TransactionsTab = () => {
  const dispatch = useDispatch();
  const { transactions, transactionTotal, transactionPage, transactionTotalPages, loading } = useSelector(s => s.admin);

  useEffect(() => { dispatch(fetchAdminTransactions({ page: 1 })); }, [dispatch]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <p className="text-sm text-gray-500">{transactionTotal} transactions total</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Property', 'Buyer', 'Seller', 'Amount', 'Type', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && transactions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No transactions found.</td></tr>
              ) : transactions.map(tx => (
                <tr key={tx._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{tx.property?.title || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tx.buyer?.name || '—'}<br /><span className="text-xs text-gray-400">{tx.buyer?.email}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tx.seller?.name || '—'}<br /><span className="text-xs text-gray-400">{tx.seller?.email}</span></td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">${(tx.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{tx.type}</td>
                  <td className="px-4 py-3"><Badge label={tx.status} colorClass={statusColors[tx.status] || 'bg-gray-100 text-gray-700'} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {transactionTotalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: transactionTotalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => dispatch(fetchAdminTransactions({ page: p }))}
              className={`px-3 py-1 text-sm rounded-md border ${p === transactionPage ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
const TABS = ['Overview', 'Users', 'Properties', 'Transactions'];

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector(s => s.admin);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Manage users, properties, and transactions across the platform.</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading spinner for initial stats load */}
      {loading && !stats && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600" />
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'Overview'     && <OverviewTab stats={stats} />}
      {activeTab === 'Users'        && <UsersTab />}
      {activeTab === 'Properties'   && <PropertiesTab />}
      {activeTab === 'Transactions' && <TransactionsTab />}
    </div>
  );
};

export default AdminDashboard;
