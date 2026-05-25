import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProperties } from '../redux/slices/propertySlice';
import { fetchUserTransactions } from '../redux/slices/transactionSlice';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { transactions } = useSelector((state) => state.transaction);
  const { properties } = useSelector((state) => state.property);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    dispatch(fetchProperties());
    dispatch(fetchUserTransactions());
  }, [isAuthenticated, navigate, dispatch]);

  const userId = user?._id || user?.id;

  const userProperties = properties?.filter(property => {
    const ownerId = property.owner?._id || property.owner;
    return ownerId?.toString() === userId?.toString();
  }) || [];

  const savedPropertyIds = new Set((user?.savedProperties || []).map(id => id?.toString()));
  const savedProperties = properties?.filter(p => savedPropertyIds.has(p._id?.toString())) || [];

  const userTransactions = transactions?.filter(transaction => {
    const buyerId  = transaction.buyer?._id  || transaction.buyer;
    const sellerId = transaction.seller?._id || transaction.seller;
    return buyerId?.toString() === userId?.toString() || sellerId?.toString() === userId?.toString();
  }) || [];

  const displayProperties = user?.role === 'seller' ? userProperties : savedProperties;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome, {user?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your {user?.role === 'seller' ? 'properties and sales' : 'saved properties and purchases'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Properties */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            {user?.role === 'seller' ? 'My Listed Properties' : 'Saved Properties'}
          </h2>
          {displayProperties.length > 0 ? (
            <div className="space-y-3">
              {displayProperties.map(property => (
                <div
                  key={property._id}
                  className="border border-gray-100 rounded-lg p-3 hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/properties/${property._id}`)}
                >
                  <h3 className="font-medium text-gray-900 text-sm truncate">{property.title}</h3>
                  <p className="text-sm text-primary-600 font-semibold mt-0.5">
                    ETB {property.price?.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">
                {user?.role === 'seller' ? "You haven't listed any properties yet." : "You haven't saved any properties yet."}
              </p>
              <button
                onClick={() => navigate(user?.role === 'seller' ? '/properties/add' : '/properties')}
                className="mt-3 text-xs text-primary-600 hover:underline font-medium"
              >
                {user?.role === 'seller' ? 'List your first property →' : 'Explore properties →'}
              </button>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          {userTransactions.length > 0 ? (
            <div className="space-y-3">
              {userTransactions.slice(0, 5).map(transaction => (
                <div key={transaction._id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {transaction.property?.title || 'Property'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        ETB {transaction.amount?.toLocaleString()}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full font-medium ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-700'
                      : transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No transactions yet.</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {user?.role === 'seller' && (
              <button
                onClick={() => navigate('/properties/add')}
                className="w-full py-3 px-4 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                + List New Property
              </button>
            )}
            <button
              onClick={() => navigate('/properties')}
              className="w-full py-3 px-4 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              Browse Properties
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="w-full py-3 px-4 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              View All Transactions
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-full py-3 px-4 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              Update Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
