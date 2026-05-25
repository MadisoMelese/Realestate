import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Search as SearchIcon,
  Favorite, FavoriteBorder,
  LocationOn, BedOutlined, BathtubOutlined,
  HomeWork, Apartment, Landscape, Business,
  VerifiedUser, SupportAgent, TrendingUp, Speed,
  ArrowForward, FormatQuote
} from '@mui/icons-material';
import axios from '../api/axios';
import { getImageUrl } from '../utils/imageUrl';

// ─────────────────────────────────────────────────────────────────────────────
// Property Card
// ─────────────────────────────────────────────────────────────────────────────
const PropertyCard = ({ property, currentUserId }) => {
  const navigate = useNavigate();
  const likesCount = property.likes?.length || 0;
  const isLiked = currentUserId && property.likes?.some(
    id => id?.toString() === currentUserId?.toString()
  );

  return (
    <div
      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/properties/${property._id}`)}
    >
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {property.images?.[0] ? (
          <img
            src={getImageUrl(property.images[0])}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <HomeWork style={{ fontSize: 48 }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold tracking-wide
          ${property.status === 'Available' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-white'}`}>
          {property.status}
        </span>
        <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-gray-700 shadow">
          {isLiked
            ? <Favorite fontSize="inherit" className="text-red-500" />
            : <FavoriteBorder fontSize="inherit" className="text-gray-400" />}
          {likesCount}
        </span>
        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="bg-white text-primary-600 text-xs font-bold px-3 py-1 rounded-full shadow">
            View Details →
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base font-bold text-gray-900 truncate flex-1 pr-2">{property.title}</h3>
          <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">{property.type}</span>
        </div>
        <p className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <LocationOn fontSize="small" className="text-primary-400" />
          {property.location?.city}, {property.location?.state}
        </p>
        <div className="flex gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
          <span className="flex items-center gap-1"><BedOutlined fontSize="small" />{property.features?.bedrooms} beds</span>
          <span className="flex items-center gap-1"><BathtubOutlined fontSize="small" />{property.features?.bathrooms} baths</span>
          <span>{property.features?.area?.toLocaleString()} sqft</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xl font-extrabold text-primary-600">
            ETB {property.price?.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400">
            {property.status === 'Available' ? 'For Sale / Rent' : property.status}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Card
// ─────────────────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
    <div className="h-56 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
      <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader = ({ label, title, subtitle, action }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
    <div>
      <span className="inline-block text-xs font-bold tracking-widest text-primary-600 uppercase mb-2 bg-primary-50 px-3 py-1 rounded-full">
        {label}
      </span>
      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-2 text-gray-500 max-w-lg">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Home
// ─────────────────────────────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [showAllFeatured, setShowAllFeatured] = useState(false);

  const [liked, setLiked] = useState([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [showAllLiked, setShowAllLiked] = useState(false);

  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    axios.get('/properties/featured')
      .then(res => setFeatured(res.data.properties || []))
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;
    setLikedLoading(true);
    axios.get('/properties', { params: { limit: 50 } })
      .then(res => {
        const all = res.data.properties || [];
        setLiked(all.filter(p => p.likes?.some(id => id?.toString() === currentUserId?.toString())));
      })
      .catch(() => setLiked([]))
      .finally(() => setLikedLoading(false));
  }, [isAuthenticated, currentUserId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
    else navigate('/properties');
  };

  const categories = [
    { label: 'Houses', icon: <HomeWork />, type: 'house', bg: 'from-orange-400 to-rose-500', img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80' },
    { label: 'Apartments', icon: <Apartment />, type: 'apartment', bg: 'from-blue-400 to-indigo-600', img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80' },
    { label: 'Land', icon: <Landscape />, type: 'land', bg: 'from-green-400 to-emerald-600', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80' },
    { label: 'Commercial', icon: <Business />, type: 'commercial', bg: 'from-purple-400 to-violet-600', img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80' },
  ];

  const whyUs = [
    { icon: <VerifiedUser style={{ fontSize: 32 }} />, title: 'Verified Listings', desc: 'Every property is manually verified by our team before going live.' },
    { icon: <SupportAgent style={{ fontSize: 32 }} />, title: '24/7 Support', desc: 'Our agents are available around the clock to assist you.' },
    { icon: <TrendingUp style={{ fontSize: 32 }} />, title: 'Best Market Prices', desc: 'We analyze the market daily to ensure you get the best deal.' },
    { icon: <Speed style={{ fontSize: 32 }} />, title: 'Fast Process', desc: 'From search to keys in hand — we make it seamless and quick.' },
  ];

  const testimonials = [
    { name: 'Sara M.', role: 'Home Buyer', text: 'Found my dream apartment in just 3 days. The process was incredibly smooth!', avatar: 'https://i.pravatar.cc/60?img=47' },
    { name: 'Alemayehu K.', role: 'Property Seller', text: 'Listed my property and had 5 serious inquiries within the first week. Amazing platform!', avatar: 'https://i.pravatar.cc/60?img=12' },
    { name: 'Amanuel T.', role: 'Investor', text: 'The market insights and verified listings gave me the confidence to invest. Highly recommend.', avatar: 'https://i.pravatar.cc/60?img=32' },
  ];

  return (
    <div className="-mt-12">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative min-h-[95vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2075&q=80')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/75" />

        {/* Floating stat cards */}
        <div className="absolute top-12 left-8 hidden xl:flex flex-col gap-4 z-10">
          {[{ n: '500+', l: 'Properties Listed' }, { n: '1.2k+', l: 'Happy Clients' }].map(s => (
            <div key={s.l} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-white shadow-2xl">
              <p className="text-3xl font-black">{s.n}</p>
              <p className="text-sm text-white/65 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="absolute top-12 right-8 hidden xl:flex flex-col gap-4 z-10">
          {[{ n: '98%', l: 'Satisfaction Rate' }, { n: '15+', l: 'Cities Covered' }].map(s => (
            <div key={s.l} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-white shadow-2xl">
              <p className="text-3xl font-black">{s.n}</p>
              <p className="text-sm text-white/65 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-7">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            New listings added daily
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
            Find Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-rose-400">
              Dream Home
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            Discover premium properties tailored to your lifestyle. Buy, sell, or rent with total confidence.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-2xl shadow-2xl p-2 gap-2">
              <div className="flex items-center flex-1 px-3 gap-2">
                <SearchIcon className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="City, property type, or keyword…"
                  className="flex-1 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none text-base bg-transparent"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0">×</button>
                )}
              </div>
              <button type="submit"
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl transition-all shadow text-sm whitespace-nowrap">
                Search
              </button>
            </div>
          </form>

          {/* Quick tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {['House', 'Apartment', 'Condo', 'Land', 'Commercial'].map(tag => (
              <button key={tag}
                onClick={() => navigate(`/properties?search=${tag.toLowerCase()}`)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-sm rounded-full transition-all">
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-white/40 text-xs">
          <span>Scroll to explore</span>
          <div className="w-5 h-8 border-2 border-white/25 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-primary-700 text-white py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: '500+', l: 'Properties' },
            { n: '1,200+', l: 'Happy Clients' },
            { n: '15+', l: 'Cities' },
            { n: '98%', l: 'Satisfaction' },
          ].map(s => (
            <div key={s.l}>
              <p className="text-4xl font-black">{s.n}</p>
              <p className="text-primary-200 text-sm mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BROWSE BY CATEGORY
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionHeader
          label="Categories"
          title="Browse by Property Type"
          subtitle="Find exactly what you're looking for — from cozy apartments to sprawling commercial spaces."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {categories.map(cat => (
            <button
              key={cat.type}
              type="button"
              aria-label={`Browse ${cat.label}`}
              onClick={() => navigate(`/properties?search=${cat.type}`)}
              className="relative rounded-2xl overflow-hidden h-44 group shadow-md hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-primary-300"
            >
              <img
                loading="lazy"
                src={cat.img}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-95"
              />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors pointer-events-none" />
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.bg} opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2 drop-shadow-lg pointer-events-none">
                <span aria-hidden="true" className="text-4xl">{cat.icon}</span>
                <span className="font-extrabold text-xl tracking-wide">{cat.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURED PROPERTIES
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Top Picks"
            title="Featured Properties"
            subtitle="Most loved properties by our community — handpicked for quality and value."
            action={
              <button onClick={() => navigate('/properties')}
                className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap group">
                View all <ArrowForward fontSize="small" className="group-hover:translate-x-1 transition-transform" />
              </button>
            }
          />

          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <HomeWork style={{ fontSize: 56 }} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium">No properties listed yet.</p>
              <button onClick={() => navigate('/properties')} className="mt-4 text-primary-600 hover:underline text-sm">
                Browse all properties
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(showAllFeatured ? featured : featured.slice(0, 3)).map(p => (
                  <PropertyCard key={p._id} property={p} currentUserId={currentUserId} />
                ))}
              </div>
              {featured.length > 3 && (
                <div className="text-center mt-10">
                  <button onClick={() => setShowAllFeatured(v => !v)}
                    className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-xl hover:bg-primary-600 hover:text-white transition-all text-sm font-bold">
                    {showAllFeatured ? '↑ Show Less' : `Show ${featured.length - 3} More ↓`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          WHY CHOOSE US
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionHeader
          label="Why Us"
          title="The Smarter Way to Find Home"
          subtitle="We combine technology, trust, and expertise to make your property journey effortless."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {whyUs.map(item => (
            <div key={item.title} className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-lg transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 mb-5 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                {item.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PROPERTIES YOU LIKED
      ══════════════════════════════════════════════════════════════════════ */}
      {isAuthenticated && (
        <div className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              label="Your Activity"
              title="Properties You Liked"
              subtitle="Pick up where you left off — properties you've shown interest in."
              action={liked.length > 0 && (
                <button onClick={() => navigate('/properties')}
                  className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap group">
                  Browse more <ArrowForward fontSize="small" className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            />

            {likedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : liked.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-gray-200">
                <FavoriteBorder style={{ fontSize: 52 }} className="text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium text-lg">You haven't liked any properties yet.</p>
                <p className="text-gray-400 text-sm mt-1 mb-6">Start exploring and tap the heart icon on properties you love.</p>
                <button onClick={() => navigate('/properties')}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-bold">
                  Explore Properties
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(showAllLiked ? liked : liked.slice(0, 3)).map(p => (
                    <PropertyCard key={p._id} property={p} currentUserId={currentUserId} />
                  ))}
                </div>
                {liked.length > 3 && (
                  <div className="text-center mt-10">
                    <button onClick={() => setShowAllLiked(v => !v)}
                      className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-xl hover:bg-primary-600 hover:text-white transition-all text-sm font-bold">
                      {showAllLiked ? '↑ Show Less' : `Show ${liked.length - 3} More ↓`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionHeader
          label="Testimonials"
          title="What Our Clients Say"
          subtitle="Real stories from real people who found their perfect property with us."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map(t => (
            <div key={t.name} className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-lg transition-shadow border border-gray-100 relative">
              <FormatQuote className="text-primary-100 absolute top-5 right-5" style={{ fontSize: 48 }} />
              <p className="text-gray-600 text-sm leading-relaxed mb-6 relative z-10">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-primary-100" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1920&q=80')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 to-primary-700/80" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center text-white space-y-6">
          <span className="inline-block text-xs font-bold tracking-widest text-primary-300 uppercase bg-white/10 px-3 py-1 rounded-full">
            Get Started Today
          </span>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            Ready to Find Your<br />Perfect Home?
          </h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Join thousands of happy homeowners and investors who trust us to find the right property.
          </p>
          <div className="flex justify-center gap-4 flex-wrap pt-2">
            <button onClick={() => navigate('/properties')}
              className="px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg text-sm">
              Browse Properties
            </button>
            {!isAuthenticated && (
              <button onClick={() => navigate('/register')}
                className="px-8 py-4 bg-transparent text-white font-bold rounded-xl border-2 border-white/40 hover:bg-white/10 transition-all text-sm">
                Create Free Account
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
