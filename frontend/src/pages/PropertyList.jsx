import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search as SearchIcon } from '@mui/icons-material';
import { fetchProperties, setFilters } from '../redux/slices/propertySlice';
import { getImageUrl } from '../utils/imageUrl';

const PropertyList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const { properties: reduxProperties, loading: reduxLoading } = useSelector(state => state.property);

  // Get search query from URL parameters and fetch properties
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
      dispatch(fetchProperties({ search: searchParam }));
    } else {
      dispatch(fetchProperties());
    }
  }, [dispatch, location.search]);

  // Debounced live search — fires 400ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      // Update URL to reflect current search (keeps browser history clean)
      const params = new URLSearchParams(location.search);
      const currentSearch = params.get('search') || '';
      if (searchQuery !== currentSearch) {
        navigate(
          searchQuery.trim()
            ? `/properties?search=${encodeURIComponent(searchQuery)}`
            : '/properties',
          { replace: true }
        );
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(
      searchQuery.trim()
        ? `/properties?search=${encodeURIComponent(searchQuery)}`
        : '/properties'
    );
  };

  useEffect(() => {
    setProperties(reduxProperties);
    setLoading(reduxLoading);
  }, [reduxProperties, reduxLoading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Search Section */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-md border border-gray-200">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location, type, or keyword…"
              className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white transition-colors flex-shrink-0"
            >
              <SearchIcon fontSize="small" />
            </button>
          </div>
        </form>
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchQuery.trim() ? `No results for "${searchQuery}"` : 'No properties found'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {searchQuery.trim()
              ? 'Try different keywords, a city name, or a property type.'
              : 'There are no properties listed yet.'}
          </p>
          {searchQuery.trim() && (
            <button
              onClick={() => { setSearchQuery(''); navigate('/properties'); }}
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <div
              key={property._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 h-48">
                {property.images && property.images[0] ? (
                  <img
                    src={getImageUrl(property.images[0])}
                    alt={property.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>
                )}
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                  {property.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {property.location?.city}, {property.location?.state}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>{property.features?.bedrooms || 0} beds</span>
                  <span>{property.features?.bathrooms || 0} baths</span>
                  <span>{property.features?.area || 0} sqft</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-primary-600 font-bold text-lg">
                    ${property.price?.toLocaleString() || 'On request'}
                  </span>
                  <button
                    onClick={() => navigate(`/properties/${property._id}`)}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-semibold"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination - TODO: Implement pagination */}
      <div className="mt-8 flex justify-center">
        {/* Add pagination components here */}
      </div>
    </div>
  );
};

export default PropertyList;