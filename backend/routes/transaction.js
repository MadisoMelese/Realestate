import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Transaction from '../models/Transaction.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer setup for receipt uploads
const receiptStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'receipt-' + unique + path.extname(file.originalname));
  }
});
const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    if (allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or PDF files are allowed'));
    }
  }
});

// @route   GET /transactions
// @desc    Get user's transactions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactions = await Transaction.find({
      $or: [{ buyer: userId }, { seller: userId }]
    })
      .populate('property')
      .populate('buyer', 'name email phoneNumber')
      .populate('seller', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /transactions/:id
// @desc    Get transaction by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('property')
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const userId = req.user.userId;
    if (transaction.buyer._id.toString() !== userId &&
        transaction.seller._id.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /transactions
// @desc    Create a new transaction
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { propertyId, type, amount } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const newTransaction = new Transaction({
      property: propertyId,
      buyer: req.user.userId,
      seller: property.owner,
      type,
      amount,
      status: 'pending'
    });

    const transaction = await newTransaction.save();
    await transaction.populate([
      { path: 'property' },
      { path: 'buyer', select: 'name email' },
      { path: 'seller', select: 'name email' }
    ]);

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /transactions/:id/complete
// @desc    Complete a transaction
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.buyer.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    transaction.status = 'completed';
    transaction.paymentInfo = transaction.paymentInfo || {};
    transaction.paymentInfo.paymentMethod = req.body.paymentMethod;
    transaction.paymentInfo.paymentDate = new Date();

    const property = await Property.findById(transaction.property);
    if (property) {
      property.status = transaction.type === 'sale' ? 'Sold' : 'Rented';
      await property.save();
    }

    await transaction.save();
    await transaction.populate([
      { path: 'property' },
      { path: 'buyer', select: 'name email' },
      { path: 'seller', select: 'name email' }
    ]);

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /transactions/:id/cancel
// @desc    Cancel a transaction
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const userId = req.user.userId;
    if (transaction.buyer.toString() !== userId &&
        transaction.seller.toString() !== userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    transaction.status = 'cancelled';
    transaction.cancelledAt = Date.now();
    transaction.cancelledBy = userId;

    await transaction.save();
    await transaction.populate([
      { path: 'property' },
      { path: 'buyer', select: 'name email' },
      { path: 'seller', select: 'name email' }
    ]);

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /transactions/:id/seller-bank
// @desc    Get seller bank account info for a pending transaction (buyer only)
// @access  Private
router.get('/:id/seller-bank', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const buyerId = req.user.userId;
    if (transaction.buyer.toString() !== buyerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const seller = await User.findById(transaction.seller).select('name email phoneNumber bankAccount');
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    res.json({
      sellerName: seller.name,
      sellerEmail: seller.email,
      sellerPhone: seller.phoneNumber,
      bankAccount: seller.bankAccount || null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /transactions/:id/upload-receipt
// @desc    Buyer uploads payment receipt — status moves to awaiting_confirmation
// @access  Private
router.post('/:id/upload-receipt', auth, uploadReceipt.single('receipt'), async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const buyerId = req.user.userId;
    if (transaction.buyer.toString() !== buyerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction is not pending' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Receipt file is required' });
    }

    const receiptUrl = `/uploads/${req.file.filename}`;
    transaction.paymentInfo = transaction.paymentInfo || {};
    transaction.paymentInfo.receiptUrl = receiptUrl;
    transaction.paymentInfo.receiptUploadedAt = new Date();
    transaction.paymentInfo.confirmedByBuyer = true;
    transaction.paymentInfo.paymentMethod = 'bank_transfer';
    transaction.paymentInfo.paymentDate = new Date();
    // Stay pending until seller confirms
    transaction.status = 'awaiting_confirmation';
    transaction.sellerConfirmation = 'pending';

    await transaction.save();
    await transaction.populate([
      { path: 'property' },
      { path: 'buyer', select: 'name email phoneNumber' },
      { path: 'seller', select: 'name email phoneNumber' }
    ]);

    res.json({ message: 'Receipt submitted. Awaiting seller confirmation.', transaction, receiptUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /transactions/:id/confirm
// @desc    Seller approves the transaction → completed
// @access  Private (seller only)
router.put('/:id/confirm', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (transaction.seller.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the seller can confirm this transaction' });
    }

    if (transaction.status !== 'awaiting_confirmation') {
      return res.status(400).json({ message: 'Transaction is not awaiting confirmation' });
    }

    transaction.status = 'completed';
    transaction.sellerConfirmation = 'approved';

    const property = await Property.findById(transaction.property);
    if (property) {
      property.status = transaction.type === 'sale' ? 'Sold' : 'Rented';
      await property.save();
    }

    await transaction.save();
    await transaction.populate([
      { path: 'property' },
      { path: 'buyer', select: 'name email phoneNumber' },
      { path: 'seller', select: 'name email phoneNumber' }
    ]);

    res.json({ message: 'Transaction approved and completed.', transaction });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /transactions/:id/reject
// @desc    Seller rejects the transaction → cancelled
// @access  Private (seller only)
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (transaction.seller.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the seller can reject this transaction' });
    }

    if (transaction.status !== 'awaiting_confirmation') {
      return res.status(400).json({ message: 'Transaction is not awaiting confirmation' });
    }

    transaction.status = 'cancelled';
    transaction.sellerConfirmation = 'rejected';
    transaction.rejectionReason = req.body.reason || '';

    await transaction.save();
    await transaction.populate([
      { path: 'property' },
      { path: 'buyer', select: 'name email phoneNumber' },
      { path: 'seller', select: 'name email phoneNumber' }
    ]);

    res.json({ message: 'Transaction rejected.', transaction });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /transactions/:id/contact
// @desc    Get contact info of the other party in a transaction
// @access  Private (buyer or seller of that transaction)
router.get('/:id/contact', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('buyer', 'name email phoneNumber')
      .populate('seller', 'name email phoneNumber');

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const userId = req.user.userId;
    const isBuyer  = transaction.buyer._id.toString() === userId;
    const isSeller = transaction.seller._id.toString() === userId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Return the OTHER party's contact info
    const contact = isBuyer ? transaction.seller : transaction.buyer;
    const role     = isBuyer ? 'seller' : 'buyer';

    res.json({
      role,
      name:        contact.name,
      email:       contact.email,
      phoneNumber: contact.phoneNumber || null,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
