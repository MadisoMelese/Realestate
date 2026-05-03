import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton
} from '@mui/material';
import {
  LocationOn,
  BedOutlined,
  BathtubOutlined,
  SquareFootOutlined,
  LocalParking,
  Weekend,
  Favorite,
  FavoriteBorder,
  ChevronLeft,
  ChevronRight,
  BookmarkBorder,
  Bookmark
} from '@mui/icons-material';
import { fetchPropertyById, toggleLikeProperty } from '../redux/slices/propertySlice';
import { toggleSaveProperty } from '../redux/slices/authSlice';
import { createTransaction } from '../redux/slices/transactionSlice';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '../components/PaymentForm';
import { getImageUrl } from '../utils/imageUrl';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentProperty, loading, error } = useSelector((state) => state.property);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { paymentIntent } = useSelector((state) => state.transaction);

  const [transactionDialog, setTransactionDialog] = useState(false);
  const [transactionType, setTransactionType] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    dispatch(fetchPropertyById(id));
  }, [dispatch, id]);

  // Reset image index when property changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [currentProperty?._id]);

  const handleLike = () => {
    if (isAuthenticated) {
      dispatch(toggleLikeProperty(id));
    } else {
      navigate('/login');
    }
  };

  const handleTransaction = (type) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setTransactionType(type);
    setTransactionDialog(true);
  };

  const handleCreateTransaction = () => {
    dispatch(createTransaction({
      propertyId: id,
      type: transactionType,
      amount: currentProperty.price
    }));
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) =>
      prev === 0 ? currentProperty.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) =>
      prev === currentProperty.images.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!currentProperty) return <Typography>Property not found</Typography>;

  const images = currentProperty.images || [];
  const hasMultipleImages = images.length > 1;

  const isLiked = Array.isArray(currentProperty.likes) && currentProperty.likes.some(
    (like) => (like._id || like).toString() === user?._id?.toString()
  );
  const isSeller = user?._id?.toString() === currentProperty.owner?._id?.toString();

  const isSaved = Array.isArray(user?.savedProperties) &&
    user.savedProperties.some(id => id?.toString() === currentProperty._id?.toString());

  const handleSave = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    dispatch(toggleSaveProperty(currentProperty._id));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Property Images */}
        <Grid item xs={12} md={8}>
          {/* Main image with prev/next controls */}
          <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: 'grey.200' }}>
            <CardMedia
              component="img"
              image={getImageUrl(images[activeImageIndex])}
              alt={`${currentProperty.title} - image ${activeImageIndex + 1}`}
              sx={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }}
            />

            {/* Prev / Next buttons — only when multiple images */}
            {hasMultipleImages && (
              <>
                <IconButton
                  onClick={handlePrevImage}
                  sx={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.45)', color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  onClick={handleNextImage}
                  sx={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.45)', color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                  }}
                >
                  <ChevronRight />
                </IconButton>

                {/* Image counter badge */}
                <Box sx={{
                  position: 'absolute', bottom: 12, right: 12,
                  bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
                  px: 1.5, py: 0.5, borderRadius: 2, fontSize: 13
                }}>
                  {activeImageIndex + 1} / {images.length}
                </Box>
              </>
            )}
          </Box>

          {/* Thumbnail strip — only when multiple images */}
          {hasMultipleImages && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
              {images.map((img, index) => (
                <Box
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  sx={{
                    flexShrink: 0,
                    width: 80,
                    height: 60,
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: index === activeImageIndex
                      ? '2px solid'
                      : '2px solid transparent',
                    borderColor: index === activeImageIndex ? 'primary.main' : 'transparent',
                    opacity: index === activeImageIndex ? 1 : 0.65,
                    transition: 'opacity 0.2s, border-color 0.2s',
                    '&:hover': { opacity: 1 }
                  }}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`Thumbnail ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Grid>

        {/* Property Details */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" gutterBottom>
              {currentProperty.title}
              <IconButton onClick={handleLike} color="primary">
                {isLiked ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
              {!isSeller && (
                <IconButton onClick={handleSave} color="primary" title={isSaved ? 'Unsave' : 'Save'}>
                  {isSaved ? <Bookmark /> : <BookmarkBorder />}
                </IconButton>
              )}
            </Typography>
            <Typography variant="h5" color="primary" gutterBottom>
              ${currentProperty.price.toLocaleString()}
            </Typography>
            <Chip
              label={currentProperty.status}
              color={currentProperty.status === 'for-sale' ? 'primary' : 'secondary'}
              sx={{ mr: 1 }}
            />
            <Chip label={currentProperty.type} />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOn sx={{ mr: 1 }} />
              {`${currentProperty.location.address}, ${currentProperty.location.city}, ${currentProperty.location.state} ${currentProperty.location.zipCode}`}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  <BedOutlined sx={{ mr: 1 }} />
                  {currentProperty.features.bedrooms} Beds
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  <BathtubOutlined sx={{ mr: 1 }} />
                  {currentProperty.features.bathrooms} Baths
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  <SquareFootOutlined sx={{ mr: 1 }} />
                  {currentProperty.features.area} sqft
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  {currentProperty.features.parking ? (
                    <>
                      <LocalParking sx={{ mr: 1 }} />
                      Parking
                    </>
                  ) : null}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  {currentProperty.features.furnished ? (
                    <>
                      <Weekend sx={{ mr: 1 }} />
                      Furnished
                    </>
                  ) : null}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {!isSeller && currentProperty.status !== 'sold' && currentProperty.status !== 'rented' && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mb: 1 }}
                onClick={() => handleTransaction(currentProperty.status === 'for-sale' ? 'sale' : 'rent')}
              >
                {currentProperty.status === 'for-sale' ? 'Buy Now' : 'Rent Now'}
              </Button>
            </Box>
          )}

          {isSeller && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => navigate(`/properties/edit/${id}`)}
              >
                Edit Property
              </Button>
            </Box>
          )}
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Description</Typography>
          <Typography variant="body1">{currentProperty.description}</Typography>
        </Grid>
      </Grid>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialog} onClose={() => setTransactionDialog(false)}>
        <DialogTitle>
          {transactionType === 'sale' ? 'Purchase Property' : 'Rent Property'}
        </DialogTitle>
        <DialogContent>
          {paymentIntent ? (
            <Elements stripe={stripePromise} options={{ clientSecret: paymentIntent.clientSecret }}>
              <PaymentForm />
            </Elements>
          ) : (
            <Box sx={{ py: 2 }}>
              <Typography variant="body1" gutterBottom>
                Total Amount: ${currentProperty.price.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Click proceed to continue with the {transactionType === 'sale' ? 'purchase' : 'rental'} process.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransactionDialog(false)}>Cancel</Button>
          {!paymentIntent && (
            <Button onClick={handleCreateTransaction} variant="contained" color="primary">
              Proceed
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PropertyDetails;