import express from "express";
import { auth, authorize } from "../middleware/auth.js";
import * as authController from "../controllers/authController.js";
import * as propertyController from "../controllers/propertyController.js";
import * as transactionController from "../controllers/transactionController.js";
import User from "../models/User.js";
import Property from "../models/Property.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Auth routes
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", auth, authController.getCurrentUser);
router.put("/auth/profile", auth, authController.updateProfile);

// Property routes
router.post("/properties", auth, propertyController.createProperty);
router.get("/properties", propertyController.getProperties);
router.get("/properties/:id", propertyController.getPropertyById);
router.put("/properties/:id", auth, propertyController.updateProperty);
router.delete("/properties/:id", auth, propertyController.deleteProperty);
router.post("/properties/:id/like", auth, propertyController.toggleLikeProperty);

// Toggle save property (adds/removes from user's savedProperties)
router.post("/properties/:id/save", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('savedProperties');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const propertyId = req.params.id;
    const alreadySaved = user.savedProperties.some(id => id.toString() === propertyId);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      alreadySaved
        ? { $pull: { savedProperties: propertyId } }
        : { $addToSet: { savedProperties: propertyId } },
      { new: true, select: 'savedProperties' }
    );

    res.json({
      message: alreadySaved ? 'Property unsaved' : 'Property saved',
      savedProperties: updatedUser.savedProperties,
      isSaved: !alreadySaved
    });
  } catch (error) {
    console.error('Toggle save error:', error);
    res.status(500).json({ message: 'Error saving property' });
  }
});

// Transaction routes
router.post("/transactions", auth, transactionController.createTransaction);
router.put("/transactions/:id/complete", auth, transactionController.completeTransaction);
router.get("/transactions", auth, transactionController.getUserTransactions);
router.get("/transactions/:id", auth, transactionController.getTransactionById);
router.put("/transactions/:id/cancel", auth, transactionController.cancelTransaction);

// ─── Admin routes ─────────────────────────────────────────────────────────────

// GET /admin/stats — overview counts and revenue
router.get("/admin/stats", auth, authorize("admin"), async (req, res) => {
  try {
    const [
      totalUsers,
      totalProperties,
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      cancelledTransactions,
      revenueResult,
      usersByRole,
      propertiesByStatus,
      recentTransactions
    ] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: "completed" }),
      Transaction.countDocuments({ status: "pending" }),
      Transaction.countDocuments({ status: "cancelled" }),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
      ]),
      Property.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Transaction.find()
        .populate("property", "title price")
        .populate("buyer", "name email")
        .populate("seller", "name email")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    res.json({
      totalUsers,
      totalProperties,
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      cancelledTransactions,
      totalRevenue: revenueResult[0]?.total || 0,
      usersByRole,
      propertiesByStatus,
      recentTransactions
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Error fetching admin stats" });
  }
});

// GET /admin/users — all users with pagination + search
router.get("/admin/users", auth, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search?.trim();

    const query = search
      ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -otpHash -otpExpiry")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// PUT /admin/users/:id/role — change a user's role
router.put("/admin/users/:id/role", auth, authorize("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    if (!["buyer", "seller", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password -otpHash -otpExpiry");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Role updated", user });
  } catch (error) {
    console.error("Admin change role error:", error);
    res.status(500).json({ message: "Error updating role" });
  }
});

// DELETE /admin/users/:id — delete a user
router.delete("/admin/users/:id", auth, authorize("admin"), async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

// GET /admin/properties — all properties with pagination + search
router.get("/admin/properties", auth, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search?.trim();

    const query = search
      ? { $or: [{ title: new RegExp(search, "i") }, { "location.city": new RegExp(search, "i") }] }
      : {};

    const [properties, total] = await Promise.all([
      Property.find(query)
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Property.countDocuments(query)
    ]);

    res.json({ properties, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Admin get properties error:", error);
    res.status(500).json({ message: "Error fetching properties" });
  }
});

// DELETE /admin/properties/:id — force delete any property
router.delete("/admin/properties/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Admin delete property error:", error);
    res.status(500).json({ message: "Error deleting property" });
  }
});

// GET /admin/transactions — all transactions with pagination + status filter
router.get("/admin/transactions", auth, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status?.trim();
    const search = req.query.search?.trim();

    const query = {};
    if (status && status !== 'all') query.status = status;

    let transactions, total;

    if (search) {
      // Search requires a lookup — use aggregation
      const pipeline = [
        {
          $lookup: {
            from: 'users', localField: 'buyer', foreignField: '_id', as: 'buyerData'
          }
        },
        {
          $lookup: {
            from: 'users', localField: 'seller', foreignField: '_id', as: 'sellerData'
          }
        },
        {
          $lookup: {
            from: 'properties', localField: 'property', foreignField: '_id', as: 'propertyData'
          }
        },
        {
          $match: {
            ...query,
            $or: [
              { 'buyerData.name':  { $regex: search, $options: 'i' } },
              { 'buyerData.email': { $regex: search, $options: 'i' } },
              { 'sellerData.name': { $regex: search, $options: 'i' } },
              { 'propertyData.title': { $regex: search, $options: 'i' } },
            ]
          }
        },
        { $sort: { createdAt: -1 } },
      ];

      const countPipeline = [...pipeline, { $count: 'total' }];
      const [countResult, rows] = await Promise.all([
        Transaction.aggregate(countPipeline),
        Transaction.aggregate([
          ...pipeline,
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ])
      ]);

      total = countResult[0]?.total || 0;
      // Re-populate via mongoose for consistent shape
      transactions = await Transaction.populate(rows, [
        { path: 'property', select: 'title price images' },
        { path: 'buyer',    select: 'name email' },
        { path: 'seller',   select: 'name email' },
      ]);
    } else {
      [transactions, total] = await Promise.all([
        Transaction.find(query)
          .populate("property", "title price images")
          .populate("buyer", "name email")
          .populate("seller", "name email")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Transaction.countDocuments(query)
      ]);
    }

    res.json({ transactions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Admin get transactions error:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

// GET /admin/activity — unified chronological activity feed
router.get("/admin/activity", auth, authorize("admin"), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const [recentUsers, recentProperties, recentTransactions] = await Promise.all([
      User.find()
        .select("name email role createdAt profileImage")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Property.find()
        .populate("owner", "name email")
        .select("title price type status location createdAt owner images")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Transaction.find()
        .populate("property", "title price")
        .populate("buyer", "name email")
        .populate("seller", "name email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    const events = [
      ...recentUsers.map(u => ({
        _id: `user-${u._id}`,
        type: 'user_registered',
        label: `New user registered`,
        detail: `${u.name} (${u.email}) joined as ${u.role}`,
        avatar: u.profileImage || null,
        meta: { userId: u._id, role: u.role },
        createdAt: u.createdAt,
      })),
      ...recentProperties.map(p => ({
        _id: `prop-${p._id}`,
        type: 'property_listed',
        label: `Property listed`,
        detail: `"${p.title}" listed by ${p.owner?.name || 'unknown'} for ETB ${(p.price || 0).toLocaleString()}`,
        meta: { propertyId: p._id, status: p.status, type: p.type },
        createdAt: p.createdAt,
      })),
      ...recentTransactions.map(tx => ({
        _id: `tx-${tx._id}`,
        type: `transaction_${tx.status}`,
        label: `Transaction ${tx.status}`,
        detail: `${tx.buyer?.name || '?'} → ${tx.property?.title || '?'} (ETB ${(tx.amount || 0).toLocaleString()}) — ${tx.type}`,
        meta: {
          transactionId: tx._id,
          status: tx.status,
          receiptUrl: tx.paymentInfo?.receiptUrl || null,
          paymentMethod: tx.paymentInfo?.paymentMethod || null,
        },
        createdAt: tx.createdAt,
      })),
    ];

    // Sort all events newest first and return top `limit`
    events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ events: events.slice(0, limit) });
  } catch (error) {
    console.error("Admin activity error:", error);
    res.status(500).json({ message: "Error fetching activity" });
  }
});

export default router;
