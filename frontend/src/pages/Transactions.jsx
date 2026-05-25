import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  fetchUserTransactions,
  cancelTransaction,
  confirmTransaction,
  rejectTransaction,
} from '../redux/slices/transactionSlice';
import { fetchAdminTransactions } from '../redux/slices/adminSlice';
import axios from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const statusStyle = {
  completed:             'bg-green-100 text-green-700',
  pending:               'bg-yellow-100 text-yellow-700',
  awaiting_confirmation: 'bg-blue-100 text-blue-700',
  cancelled:             'bg-red-100 text-red-700',
  refunded:              'bg-gray-100 text-gray-600',
};

const statusLabel = {
  completed:             'Completed',
  pending:               'Pending',
  awaiting_confirmation: 'Awaiting Seller Confirmation',
  cancelled:             'Cancelled',
  refunded:              'Refunded',
};

// ─── Contact Info Modal ───────────────────────────────────────────────────────
const ContactModal = ({ txId, token, onClose }) => {
  const [info, setInfo]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    axios.get(`/transactions/${txId}/contact`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => setInfo(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load contact'))
      .finally(() => setLoading(false));
  }, [txId, token]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="text-base font-bold text-gray-900 mb-4 capitalize">
          {info ? `${info.role} Contact` : 'Contact Info'}
        </h3>
        {loading && <p className="text-sm text-gray-400">Loading…</p>}
        {error   && <p className="text-sm text-red-600">{error}</p>}
        {info && (
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-gray-400">Name</p>
              <p className="font-semibold text-gray-900">{info.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <a href={`mailto:${info.email}`} className="text-primary-600 hover:underline">{info.email}</a>
            </div>
            {info.phoneNumber && (
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <a href={`tel:${info.phoneNumber}`} className="text-primary-600 hover:underline">{info.phoneNumber}</a>
              </div>
            )}
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-5 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="text-base font-bold text-gray-900 mb-2">Reject Transaction</h3>
        <p className="text-sm text-gray-500 mb-4">Optionally provide a reason for the buyer.</p>
        <textarea
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Transactions = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { transactions, loading, error } = useSelector(s => s.transaction);
  const { adminTransactions, adminLoading } = useSelector(s => ({
    adminTransactions: s.admin.transactions,
    adminLoading:      s.admin.loading,
  }));
  const { user, token } = useSelector(s => s.auth);

  const isAdmin = user?.role === 'admin';
  const userId  = user?._id || user?.id;

  const [contactTxId, setContactTxId]   = useState(null); // open contact modal
  const [rejectTxId,  setRejectTxId]    = useState(null); // open reject modal
  const [actionLoading, setActionLoading] = useState(null); // txId being acted on

  useEffect(() => {
    if (isAdmin) dispatch(fetchAdminTransactions({ page: 1 }));
    else         dispatch(fetchUserTransactions());
  }, [dispatch, isAdmin]);

  const handleCancel = (id) => {
    if (window.confirm('Cancel this transaction?')) dispatch(cancelTransaction(id));
  };

  const handleConfirm = async (id) => {
    setActionLoading(id);
    try {
      await dispatch(confirmTransaction(id)).unwrap();
      dispatch(fetchUserTransactions());
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, reason) => {
    setRejectTxId(null);
    setActionLoading(id);
    try {
      await dispatch(rejectTransaction({ transactionId: id, reason })).unwrap();
      dispatch(fetchUserTransactions());
    } finally {
      setActionLoading(null);
    }
  };

  const displayTransactions = isAdmin ? adminTransactions : transactions;
  const isLoading = isAdmin ? adminLoading : loading;

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600" />
    </div>
  );

  if (!isAdmin && error) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Modals */}
      {contactTxId && (
        <ContactModal txId={contactTxId} token={token} onClose={() => setContactTxId(null)} />
      )}
      {rejectTxId && (
        <RejectModal
          onConfirm={(reason) => handleReject(rejectTxId, reason)}
          onCancel={() => setRejectTxId(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isAdmin ? 'All Transactions' : 'My Transactions'}
        </h1>
        {isAdmin && (
          <button onClick={() => navigate('/admin')} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
            ← Admin Dashboard
          </button>
        )}
      </div>

      {displayTransactions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-lg font-medium mb-2">No transactions yet</p>
          <p className="text-gray-400 text-sm mb-6">
            {isAdmin ? 'No transactions have been made on the platform yet.' : 'Start by browsing available properties.'}
          </p>
          {!isAdmin && (
            <button onClick={() => navigate('/properties')} className="px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">
              Browse Properties
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayTransactions.map(tx => {
            const isBuyer  = (tx.buyer?._id  || tx.buyer )?.toString() === userId?.toString();
            const isSeller = (tx.seller?._id || tx.seller)?.toString() === userId?.toString();
            const isActing = actionLoading === tx._id;

            return (
              <div key={tx._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

                {/* Top row */}
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div className="min-w-0">
                    <Link
                      to={`/properties/${tx.property?._id}`}
                      className="text-base font-bold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1"
                    >
                      {tx.property?.title || 'Property'}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
                      {tx.type === 'sale' ? 'Purchase' : 'Rental'} · {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel[tx.status] || tx.status}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Amount</p>
                    <p className="font-bold text-gray-900">ETB {tx.amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Buyer</p>
                    <p className="font-medium text-gray-700 truncate">{tx.buyer?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Seller</p>
                    <p className="font-medium text-gray-700 truncate">{tx.seller?.name || '—'}</p>
                  </div>
                  {tx.paymentInfo?.paymentMethod && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Payment</p>
                      <p className="font-medium text-gray-700 capitalize">{tx.paymentInfo.paymentMethod.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>

                {/* Rejection reason */}
                {tx.status === 'cancelled' && tx.rejectionReason && (
                  <div className="mb-3 px-3 py-2 bg-red-50 rounded-lg text-xs text-red-700">
                    <span className="font-semibold">Rejection reason: </span>{tx.rejectionReason}
                  </div>
                )}

                {/* Receipt */}
                {tx.paymentInfo?.receiptUrl && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-400">Receipt:</span>
                    <a
                      href={`${API_BASE}${tx.paymentInfo.receiptUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary-600 hover:underline"
                    >
                      View Receipt ↗
                    </a>
                    {tx.paymentInfo.confirmedByBuyer && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        Submitted by Buyer
                      </span>
                    )}
                  </div>
                )}

                {/* Action row */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">

                  {/* Contact button — visible to both parties once transaction exists */}
                  {(isBuyer || isSeller) && !isAdmin && (
                    <button
                      onClick={() => setContactTxId(tx._id)}
                      className="px-3 py-1.5 text-xs font-semibold text-primary-600 border border-primary-200 rounded-full hover:bg-primary-50 transition-colors"
                    >
                      {isBuyer ? '📞 Seller Contact' : '📞 Buyer Contact'}
                    </button>
                  )}

                  {/* Buyer: cancel if still pending */}
                  {isBuyer && tx.status === 'pending' && !isAdmin && (
                    <button
                      onClick={() => handleCancel(tx._id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-full hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}

                  {/* Buyer: awaiting confirmation info */}
                  {isBuyer && tx.status === 'awaiting_confirmation' && (
                    <span className="text-xs text-blue-600 font-medium self-center">
                      ⏳ Waiting for seller to confirm your payment
                    </span>
                  )}

                  {/* Seller: approve / reject when awaiting confirmation */}
                  {isSeller && tx.status === 'awaiting_confirmation' && !isAdmin && (
                    <>
                      <button
                        disabled={isActing}
                        onClick={() => handleConfirm(tx._id)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-full transition-colors disabled:opacity-50"
                      >
                        {isActing ? '…' : '✓ Approve Payment'}
                      </button>
                      <button
                        disabled={isActing}
                        onClick={() => setRejectTxId(tx._id)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors disabled:opacity-50"
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Transactions;
