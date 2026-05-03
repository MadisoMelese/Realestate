import express from "express";
import { auth } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import * as propertyController from "../controllers/propertyController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for property images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

import Property from "../models/Property.js";

// Property routes
router.post('/', auth, upload.array('images', 10), propertyController.createProperty);
router.get('/', propertyController.getProperties);

// Must be before /:id to avoid "featured" being treated as an ID
router.get('/featured', async (req, res) => {
  try {
    const properties = await Property.find({ status: "Available" })
      .populate("owner", "name")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Sort by likes count descending, take top 6
    const sorted = properties
      .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      .slice(0, 6);

    res.json({ properties: sorted });
  } catch (error) {
    console.error("Featured properties error:", error);
    res.status(500).json({ message: "Error fetching featured properties" });
  }
});

router.get('/:id', propertyController.getPropertyById);
router.put('/:id', auth, upload.array('images', 10), propertyController.updateProperty);
router.delete('/:id', auth, propertyController.deleteProperty);
router.post('/:id/like', auth, propertyController.toggleLikeProperty);

export default router;