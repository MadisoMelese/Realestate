import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Grid,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  CircularProgress,
  Divider,
  Stepper,
  Step,
  StepLabel
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
  Bookmark,
  AccountBalance,
  UploadFile,
  CheckCircle
} from '@mui/icons-material';
import { fetchPropertyById, toggleLikeProperty, deleteProperty } from '../redux/slices/propertySlice';
import { toggleSaveProperty } from '../redux/slices/authSlice';
import {
  createTransaction,
  fetchSellerBankInfo,
  uploadPaymentReceipt,
  clearSellerBankInfo
} from '../redux/slices/transactionSlice';
import { getImageUrl } from '../utils/imageUrl';

const STEPS = ['Initiate', 'Bank Details', 'Upload Receipt', 'Done'];

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProperty, loading, error } = useSelector((state) => state.property);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const {
    sellerBankInfo,
    bankInfoLoading,
    receiptUploading
  } = useSelector((state) => state.transaction);

  const [transactionDialog, setTransactionDialog] = useState(false);
  const [transactionType, setTransactionType] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [step, setStep] = useState(0); // 0=confirm, 1=bank info, 2=upload receipt, 3=done
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [txError, setTxError] = useState(null);
  const [initiating, setInitiating] = useState(false);
  // Store the transaction id locally so we never depend on Redux state being in sync
  const [activeTxId, setActiveTxId] = useState(null);

  useEffect(() => {
    dispatch(fetchPropertyById(id));
  }, [dispatch, id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [currentProperty?._id]);

  const handleLike = () => {
    if (isAuthenticated) dispatch(toggleLikeProperty(id));
    else navigate('/login');
  };

  const handleTransaction = (type) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setTransactionType(type);
    setStep(0);
    setReceiptFile(null);
    setReceiptPreview(null);
    setTxError(null);
    setActiveTxId(null);
    dispatch(clearSellerBankInfo());
    setTransactionDialog(true);
  };

  const handleProceed = async () => {
    setTxError(null);
    setInitiating(true);
    try {
      const tx = await dispatch(createTransaction({
        propertyId: id,
        type: transactionType,
        amount: currentProperty.price
      })).unwrap();

      // tx is the transaction object returned directly from the backend
      const txId = tx._id;
      if (!txId) throw new Error('Transaction ID missing from server response');

      setActiveTxId(txId); // store locally — never rely on Redux currentTransaction
      await dispatch(fetchSellerBankInfo(txId)).unwrap();
      setStep(1);
    } catch (err) {
      setTxError(err?.message || 'Failed to initiate transaction');
    } finally {
      setInitiating(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview(null);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile) { setTxError('Please select a receipt file'); return; }
    if (!activeTxId) { setTxError('Transaction ID is missing. Please start over.'); return; }
    setTxError(null);
    try {
      await dispatch(uploadPaymentReceipt({ transactionId: activeTxId, file: receiptFile })).unwrap();
      setStep(3);
    } catch (err) {
      setTxError(err?.message || 'Failed to upload receipt');
    }
  };

  const handleCloseDialog = () => {
    setTransactionDialog(false);
    setStep(0);
    setReceiptFile(null);
    setReceiptPreview(null);
    setTxError(null);
    setActiveTxId(null);
    dispatch(clearSellerBankInfo());
    if (step === 3) dispatch(fetchPropertyById(id));
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
  const isAdmin = user?.role === 'admin';
  const isOwner = user?._id?.toString() === (currentProperty.owner?._id || currentProperty.owner)?.toString();
  const canManage = isOwner || isAdmin;

  const isSaved = Array.isArray(user?.savedProperties) &&
    user.savedProperties.some(sid => sid?.toString() === currentProperty._id?.toString());

  const handleSave = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    dispatch(toggleSaveProperty(currentProperty._id));
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this property? This cannot be undone.')) return;
    try {
      await dispatch(deleteProperty(id)).unwrap();
      navigate('/properties');
    } catch {
      alert('Failed to delete property.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Property Images */}
        <Grid item xs={12} md={8}>
          <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: 'grey.200' }}>
            <CardMedia
              component="img"
              image={getImageUrl(images[activeImageIndex])}
              alt={`${currentProperty.title} - image ${activeImageIndex + 1}`}
              sx={{ width: '100%', height: { xs: 260, sm: 340, md: 420 }, objectFit: 'cover', display: 'block' }}
            />
            {hasMultipleImages && (
              <>
                <IconButton
                  onClick={handlePrevImage}
                  sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.45)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  onClick={handleNextImage}
                  sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.45)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                >
                  <ChevronRight />
                </IconButton>
                <Box sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: 'rgba(0,0,0,0.55)', color: 'white', px: 1.5, py: 0.5, borderRadius: 2, fontSize: 13 }}>
                  {activeImageIndex + 1} / {images.length}
                </Box>
              </>
            )}
          </Box>

          {hasMultipleImages && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
              {images.map((img, index) => (
                <Box
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  sx={{
                    flexShrink: 0, width: 80, height: 60, borderRadius: 1, overflow: 'hidden', cursor: 'pointer',
                    border: index === activeImageIndex ? '2px solid' : '2px solid transparent',
                    borderColor: index === activeImageIndex ? 'primary.main' : 'transparent',
                    opacity: index === activeImageIndex ? 1 : 0.65,
                    transition: 'opacity 0.2s, border-color 0.2s',
                    '&:hover': { opacity: 1 }
                  }}
                >
                  <img src={getImageUrl(img)} alt={`Thumbnail ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
              {!canManage && (
                <IconButton onClick={handleSave} color="primary" title={isSaved ? 'Unsave' : 'Save'}>
                  {isSaved ? <Bookmark /> : <BookmarkBorder />}
                </IconButton>
              )}
            </Typography>
            <Typography variant="h5" color="primary" gutterBottom>
              ETB {currentProperty.price.toLocaleString()}
            </Typography>
            <Chip label={currentProperty.status} color={currentProperty.status === 'for-sale' ? 'primary' : 'secondary'} sx={{ mr: 1 }} />
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
                  <BedOutlined sx={{ mr: 1 }} /> {currentProperty.features.bedrooms} Beds
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  <BathtubOutlined sx={{ mr: 1 }} /> {currentProperty.features.bathrooms} Baths
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  <SquareFootOutlined sx={{ mr: 1 }} /> {currentProperty.features.area} sqft
                </Typography>
              </Grid>
              {currentProperty.features.parking && (
                <Grid item xs={6}>
                  <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocalParking sx={{ mr: 1 }} /> Parking
                  </Typography>
                </Grid>
              )}
              {currentProperty.features.furnished && (
                <Grid item xs={6}>
                  <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                    <Weekend sx={{ mr: 1 }} /> Furnished
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          {!canManage && currentProperty.status !== 'Sold' && currentProperty.status !== 'Rented' && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mb: 1 }}
                onClick={() => handleTransaction('sale')}
              >
                Buy Now
              </Button>
            </Box>
          )}

          {canManage && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {isAdmin && !isOwner && (
                <Box sx={{ mb: 1, px: 1.5, py: 0.75, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                  <Typography variant="caption" color="warning.dark">
                    Admin override — managing on behalf of owner
                  </Typography>
                </Box>
              )}
              <Button variant="outlined" color="primary" fullWidth onClick={() => navigate(`/properties/edit/${id}`)}>
                Edit Property
              </Button>
              <Button variant="outlined" color="error" fullWidth onClick={handleDelete}>
                Delete Property
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
      <Dialog open={transactionDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {transactionType === 'sale' ? 'Purchase Property' : 'Rent Property'}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={step} sx={{ mb: 3, mt: 1 }} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {txError && <Alert severity="error" sx={{ mb: 2 }}>{txError}</Alert>}

          {/* Step 0 — Confirm */}
          {step === 0 && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Property:</strong> {currentProperty.title}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> ETB {currentProperty.price.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click <strong>Proceed</strong> to view the seller's bank account details and make a direct bank transfer.
              </Typography>
            </Box>
          )}

          {/* Step 1 — Bank Info */}
          {step === 1 && (
            <Box>
              {bankInfoLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : sellerBankInfo ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AccountBalance color="primary" />
                    <Typography variant="h6">Seller Bank Account</Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2.5, border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Seller</Typography>
                    <Typography variant="body1" fontWeight={600} gutterBottom>{sellerBankInfo.sellerName}</Typography>
                    {sellerBankInfo.sellerPhone && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>📞 {sellerBankInfo.sellerPhone}</Typography>
                    )}
                    <Divider sx={{ my: 1.5 }} />
                    {sellerBankInfo.bankAccount?.bankName ? (
                      <>
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Bank Name</Typography>
                            <Typography variant="body2" fontWeight={500}>{sellerBankInfo.bankAccount.bankName}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Account Holder</Typography>
                            <Typography variant="body2" fontWeight={500}>{sellerBankInfo.bankAccount.accountHolderName}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Account Number</Typography>
                            <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>{sellerBankInfo.bankAccount.accountNumber}</Typography>
                          </Grid>
                          {sellerBankInfo.bankAccount.routingNumber && (
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Routing Number</Typography>
                              <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>{sellerBankInfo.bankAccount.routingNumber}</Typography>
                            </Grid>
                          )}
                        </Grid>
                        {sellerBankInfo.bankAccount.instructions && (
                          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                            <Typography variant="caption" color="info.dark" fontWeight={600}>Instructions</Typography>
                            <Typography variant="body2" color="info.dark">{sellerBankInfo.bankAccount.instructions}</Typography>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        The seller has not added bank account details yet. Please contact them directly at <strong>{sellerBankInfo.sellerEmail}</strong>.
                      </Alert>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    After making the transfer, click <strong>Next</strong> to upload your payment receipt.
                  </Typography>
                </Box>
              ) : null}
            </Box>
          )}

          {/* Step 2 — Upload Receipt */}
          {step === 2 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <UploadFile color="primary" />
                <Typography variant="h6">Upload Payment Receipt</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Attach the receipt or screenshot from your bank confirming the transfer of <strong>ETB {currentProperty.price.toLocaleString()}</strong>.
              </Typography>
              <Box
                sx={{
                  mt: 2, border: '2px dashed', borderColor: receiptFile ? 'success.main' : 'grey.300',
                  borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer',
                  bgcolor: receiptFile ? 'success.50' : 'grey.50',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
                }}
                onClick={() => document.getElementById('receipt-input').click()}
              >
                <input
                  id="receipt-input"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {receiptFile ? (
                  <>
                    {receiptPreview && (
                      <img src={receiptPreview} alt="Receipt preview" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 8, marginBottom: 8 }} />
                    )}
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      ✓ {receiptFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Click to change file</Typography>
                  </>
                ) : (
                  <>
                    <UploadFile sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Click to select receipt (JPG, PNG, or PDF)</Typography>
                  </>
                )}
              </Box>
            </Box>
          )}

          {/* Step 3 — Done */}
          {step === 3 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Receipt Submitted!</Typography>
              <Typography variant="body2" color="text.secondary">
                Your payment receipt has been sent to the seller. The transaction will be marked as <strong>completed</strong> once the seller confirms the payment.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {step < 3 && (
            <Button onClick={handleCloseDialog} disabled={initiating || receiptUploading}>
              Cancel
            </Button>
          )}
          {step === 0 && (
            <Button onClick={handleProceed} variant="contained" color="primary" disabled={initiating}>
              {initiating ? <CircularProgress size={20} color="inherit" /> : 'Proceed'}
            </Button>
          )}
          {step === 1 && (
            <Button onClick={() => setStep(2)} variant="contained" color="primary">
              Next — Upload Receipt
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleUploadReceipt} variant="contained" color="success" disabled={!receiptFile || receiptUploading}>
              {receiptUploading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Payment'}
            </Button>
          )}
          {step === 3 && (
            <>
              <Button onClick={() => navigate('/transactions')} variant="outlined">
                View Transactions
              </Button>
              <Button onClick={handleCloseDialog} variant="contained" color="primary">
                Close
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PropertyDetails;
