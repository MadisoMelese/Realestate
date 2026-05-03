import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { fetchUserTransactions, cancelTransaction } from '../redux/slices/transactionSlice';

const statusStyle = {
  completed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded:  'bg-gray-100 text-gray-600',
};

const Transactions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { transactions, loading, error } = useSelector(s => s.transaction);
  const { user } = useSelector(s => s.auth);

  useEffect(() => { dispatch(fetchUserTransactions()); }, [dispatch]);

  const handleCancel = (id) => {
    if (window.confirm('Cancel this transaction?')) dispatch(cancelTransaction(id));
  };

  const userId = user?._id || user?.id;

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600" />
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">My Transactions</h1>

      {transactions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-lg font-medium mb-2">No transactions yet</p>
          <p className="text-gray-400 text-sm mb-6">Start by browsing available properties.</p>
          <button
            onClick={() => navigate('/properties')}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700"
          >
            Browse Properties
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map(tx => {
            const isBuyer = (tx.buyer?._id || tx.buyer)?.toString() === userId?.toString();
            return (
              <div key={tx._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                {/* Top row: title + status */}
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusStyle[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                      {tx.status}
                    </span>
                    {tx.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(tx._id)}
                        className="px-3 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-full hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Amount</p>
                    <p className="font-bold text-gray-900">${tx.amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{isBuyer ? 'Seller' : 'Buyer'}</p>
                    <p className="font-medium text-gray-700 truncate">
                      {isBuyer ? (tx.seller?.name || '—') : (tx.buyer?.name || '—')}
                    </p>
                  </div>
                  {tx.paymentInfo?.paymentMethod && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Payment</p>
                      <p className="font-medium text-gray-700 capitalize">{tx.paymentInfo.paymentMethod}</p>
                    </div>
                  )}
                </div>

                {tx.contractDetails?.terms && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">{tx.contractDetails.terms}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Transactions;
