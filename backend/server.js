require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1); // Exit if cannot connect
});

// Middlewares
app.use(cors());
app.use(express.json());
const uploadsPath = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));

// Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Enhanced Product Schema with more fields and validation
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: "" },
  brand: { type: String, default: "" },
  model: { type: String, default: "" },
  year: { type: Number, default: null },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: null, min: 0 },
  status: { 
    type: String, 
    enum: ["In Stock", "Out of Stock", "Limited Stock", "Pre-Order", "Discontinued"],
    default: "In Stock"
  },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews: { type: Number, min: 0, default: 0 },
  image: { type: String, default: "" },
  images: [{ type: String }], // Multiple images
  badge: { 
    type: String, 
    enum: ["", "Best Seller", "New Arrival", "Hot Deal", "Premium", "Limited Edition", "Sale", "Trending"],
    default: ""
  },
  description: { type: String, default: "" },
  specifications: {
    weight: { type: String, default: "" },
    dimensions: { type: String, default: "" },
    material: { type: String, default: "" },
    color: { type: String, default: "" },
    warranty: { type: String, default: "" },
    compatibility: [{ type: String }], // Compatible vehicle models
    partNumber: { type: String, default: "" },
    origin: { type: String, default: "" }
  },
  stock: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  tags: [{ type: String }],
  featured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model("Product", productSchema);

// Bill Schema for database storage
const billSchema = new mongoose.Schema({
  billNumber: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  customer: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true }
  },
  items: [{
    product: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      category: String,
      brand: String,
      price: Number,
      image: String
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 }
  }],
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, required: true, min: 0, max: 100 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ["Draft", "Pending", "Paid", "Cancelled"],
    default: "Draft"
  },
  notes: { type: String, default: "" },
  pdfPath: { type: String, default: "" }, // Store PDF file path
  pdfGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  paidAt: { type: Date },
  // Additional fields for better tracking
  paymentMethod: { type: String, default: "" },
  cashierName: { type: String, default: "" },
  branchLocation: { type: String, default: "Main Branch" }
});

// Update timestamp on save
billSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'Paid' && !this.paidAt) {
    this.paidAt = Date.now();
  }
  next();
});

const Bill = mongoose.model("Bill", billSchema);

// Category Schema for dynamic categories
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  subcategories: [{ 
    name: String,
    description: String
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model("Category", categorySchema);

// Brand Schema
const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  logo: { type: String, default: "" },
  description: { type: String, default: "" },
  website: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Brand = mongoose.model("Brand", brandSchema);

// Initialize default categories if they don't exist
const initializeCategories = async () => {
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        {
          name: "Braking System",
          description: "Brake pads, rotors, calipers, and brake fluids",
          subcategories: [
            { name: "Brake Pads", description: "High-performance brake pads" },
            { name: "Brake Rotors", description: "Disc brake rotors and drums" },
            { name: "Brake Calipers", description: "Brake calipers and hardware" },
            { name: "Brake Fluids", description: "DOT 3, DOT 4, and DOT 5 brake fluids" },
            { name: "Brake Lines", description: "Brake hoses and steel lines" }
          ]
        },
        {
          name: "Engine Components",
          description: "Engine parts, filters, and performance upgrades",
          subcategories: [
            { name: "Air Filters", description: "Engine air filters and intakes" },
            { name: "Oil Filters", description: "Engine oil filters" },
            { name: "Fuel Filters", description: "Fuel system filters" },
            { name: "Spark Plugs", description: "Ignition spark plugs and coils" },
            { name: "Belts & Hoses", description: "Engine belts and cooling hoses" },
            { name: "Gaskets & Seals", description: "Engine gaskets and sealing components" }
          ]
        },
        {
          name: "Lighting",
          description: "Headlights, taillights, and interior lighting",
          subcategories: [
            { name: "Headlights", description: "LED, HID, and halogen headlights" },
            { name: "Taillights", description: "Rear lighting systems" },
            { name: "Interior Lights", description: "Cabin and dashboard lighting" },
            { name: "Signal Lights", description: "Turn signals and hazard lights" },
            { name: "Light Bulbs", description: "Replacement bulbs and LEDs" }
          ]
        },
        {
          name: "Suspension",
          description: "Shocks, struts, springs, and suspension components",
          subcategories: [
            { name: "Shock Absorbers", description: "Front and rear shock absorbers" },
            { name: "Struts", description: "MacPherson and coilover struts" },
            { name: "Springs", description: "Coil springs and leaf springs" },
            { name: "Bushings", description: "Suspension bushings and mounts" },
            { name: "Sway Bars", description: "Anti-roll bars and links" }
          ]
        },
        {
          name: "Exhaust System",
          description: "Mufflers, catalytic converters, and exhaust pipes",
          subcategories: [
            { name: "Mufflers", description: "Performance and OEM mufflers" },
            { name: "Catalytic Converters", description: "Emissions control systems" },
            { name: "Exhaust Pipes", description: "Headers and exhaust tubing" },
            { name: "Resonators", description: "Sound dampening components" }
          ]
        },
        {
          name: "Interior",
          description: "Seats, dashboard, and interior accessories",
          subcategories: [
            { name: "Seat Covers", description: "Custom and universal seat covers" },
            { name: "Floor Mats", description: "All-weather and carpet floor mats" },
            { name: "Dashboard", description: "Dashboard covers and accessories" },
            { name: "Steering Wheels", description: "Aftermarket steering wheels" },
            { name: "Interior Trim", description: "Decorative interior components" }
          ]
        },
        {
          name: "Exterior",
          description: "Body parts, mirrors, and exterior accessories",
          subcategories: [
            { name: "Bumpers", description: "Front and rear bumpers" },
            { name: "Mirrors", description: "Side and rearview mirrors" },
            { name: "Grilles", description: "Front grilles and mesh inserts" },
            { name: "Body Kits", description: "Aerodynamic body components" },
            { name: "Spoilers", description: "Rear and front spoilers" }
          ]
        },
        {
          name: "Tires & Wheels",
          description: "Tires, rims, and wheel accessories",
          subcategories: [
            { name: "All-Season Tires", description: "Year-round tire options" },
            { name: "Performance Tires", description: "High-performance tires" },
            { name: "Winter Tires", description: "Snow and ice tires" },
            { name: "Alloy Wheels", description: "Lightweight alloy rims" },
            { name: "Steel Wheels", description: "Durable steel rims" },
            { name: "Wheel Accessories", description: "Lug nuts, center caps, and valve stems" }
          ]
        },
        {
          name: "Electrical",
          description: "Batteries, alternators, and electrical components",
          subcategories: [
            { name: "Batteries", description: "Car batteries and accessories" },
            { name: "Alternators", description: "Charging system components" },
            { name: "Starters", description: "Engine starter motors" },
            { name: "Wiring", description: "Electrical wiring and connectors" },
            { name: "Fuses & Relays", description: "Electrical protection components" }
          ]
        },
        {
          name: "Cooling System",
          description: "Radiators, thermostats, and cooling components",
          subcategories: [
            { name: "Radiators", description: "Engine cooling radiators" },
            { name: "Water Pumps", description: "Coolant circulation pumps" },
            { name: "Thermostats", description: "Temperature control valves" },
            { name: "Cooling Fans", description: "Electric and mechanical fans" },
            { name: "Coolant", description: "Antifreeze and coolant fluids" }
          ]
        },
        {
          name: "Transmission",
          description: "Transmission parts and fluids",
          subcategories: [
            { name: "Transmission Fluid", description: "ATF and manual transmission oils" },
            { name: "Clutch Kits", description: "Manual transmission clutch components" },
            { name: "Torque Converters", description: "Automatic transmission components" },
            { name: "CV Joints", description: "Constant velocity joints and axles" }
          ]
        },
        {
          name: "Tools & Equipment",
          description: "Automotive tools and garage equipment",
          subcategories: [
            { name: "Hand Tools", description: "Wrenches, sockets, and screwdrivers" },
            { name: "Power Tools", description: "Electric and pneumatic tools" },
            { name: "Diagnostic Tools", description: "OBD scanners and multimeters" },
            { name: "Garage Equipment", description: "Jacks, stands, and lifts" }
          ]
        }
      ];

      await Category.insertMany(defaultCategories);
      console.log("Default categories initialized");
    }
  } catch (error) {
    console.error("Error initializing categories:", error);
  }
};

// Initialize categories on startup
initializeCategories();

// Generate unique bill number
const generateUniqueBillNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  let billNumber;
  let isUnique = false;
  let counter = 1;
  
  while (!isUnique) {
    const random = String(counter).padStart(3, '0');
    billNumber = `AN-${year}${month}${day}-${random}`;
    
    const existingBill = await Bill.findOne({ billNumber });
    if (!existingBill) {
      isUnique = true;
    } else {
      counter++;
    }
  }
  
  return billNumber;
};

// Routes

// GET all products with enhanced filtering and pagination
app.get("/api/products", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      subcategory,
      brand, 
      minPrice, 
      maxPrice, 
      status, 
      featured,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };
    
    if (category && category !== 'All Categories') query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = brand;
    if (status) query.status = status;
    if (featured) query.featured = featured === 'true';
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST create product + image upload (enhanced)
app.post("/api/products", upload.array("images", 5), async (req, res) => {
  try {
    const data = req.body;
    
    // Parse JSON fields if they're strings
    const specifications = typeof data.specifications === 'string' 
      ? JSON.parse(data.specifications) 
      : data.specifications || {};
    
    const tags = typeof data.tags === 'string'
      ? JSON.parse(data.tags)
      : data.tags || [];

    const compatibility = typeof data.compatibility === 'string'
      ? JSON.parse(data.compatibility)
      : data.compatibility || [];

    // Validate rating before creating product
    const rating = data.rating ? Math.min(Math.max(Number(data.rating), 0), 5) : 0;
    // This ensures rating is between 0-5 (clamps the value)

    const product = new Product({
      ...data,
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      rating: rating, // Use the validated rating
      reviews: Number(data.reviews) || 0,
      year: data.year ? Number(data.year) : null,
      stock: Number(data.stock) || 0,
      discount: Number(data.discount) || 0,
      featured: data.featured === 'true',
      image: req.files && req.files[0] ? `/uploads/${req.files[0].filename}` : "",
      images: req.files ? req.files.map(file => `/uploads/${file.filename}`) : [],
      specifications: {
        ...specifications,
        compatibility
      },
      tags
    });
    
    await product.save();
    io.emit("productCreated", product);
    res.status(201).json(product);
  } catch (e) {
    console.error("Create product error:", e);
    res.status(500).json({ error: "Failed to create product", details: e.message });
  }
});

// PUT update product + image upload (enhanced)
app.put("/api/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const data = req.body;
    
    const specifications = typeof data.specifications === 'string' 
      ? JSON.parse(data.specifications) 
      : data.specifications || {};
    
    const tags = typeof data.tags === 'string'
      ? JSON.parse(data.tags)
      : data.tags || [];

    const compatibility = typeof data.compatibility === 'string'
      ? JSON.parse(data.compatibility)
      : data.compatibility || [];

    // Validate rating before updating product
    const rating = data.rating ? Math.min(Math.max(Number(data.rating), 0), 5) : undefined;
    // This ensures rating is between 0-5 (clamps the value)
    // If rating isn't provided, it won't be updated

    const updateData = {
      ...data,
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      rating: rating, // Use the validated rating (or undefined if not provided)
      reviews: Number(data.reviews) || 0,
      year: data.year ? Number(data.year) : null,
      stock: Number(data.stock) || 0,
      discount: Number(data.discount) || 0,
      featured: data.featured === 'true',
      specifications: {
        ...specifications,
        compatibility
      },
      tags,
      updatedAt: Date.now()
    };

    // Remove rating from updateData if it wasn't provided
    if (rating === undefined) {
      delete updateData.rating;
    }

    if (req.files && req.files.length > 0) {
      updateData.image = `/uploads/${req.files[0].filename}`;
      updateData.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    io.emit("productUpdated", product);
    res.json(product);
  } catch (e) {
    console.error("Update product error:", e);
    res.status(500).json({ error: "Failed to update product", details: e.message });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    io.emit("productDeleted", req.params.id);
    res.json({ message: "Product deleted" });
  } catch (e) {
    console.error("Delete product error:", e);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Category Routes
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Brand Routes
app.get("/api/brands", async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true });
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch brands" });
  }
});

app.post("/api/brands", upload.single("logo"), async (req, res) => {
  try {
    const brand = new Brand({
      ...req.body,
      logo: req.file ? `/uploads/${req.file.filename}` : ""
    });
    await brand.save();
    res.status(201).json(brand);
  } catch (err) {
    res.status(500).json({ error: "Failed to create brand" });
  }
});

// Statistics Route
app.get("/api/stats", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const inStock = await Product.countDocuments({ status: "In Stock", isActive: true });
    const outOfStock = await Product.countDocuments({ status: "Out of Stock", isActive: true });
    const featured = await Product.countDocuments({ featured: true, isActive: true });
    
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalProducts,
      inStock,
      outOfStock,
      featured,
      categoryStats
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Bill Routes

// GET all bills with pagination and filtering
app.get("/api/bills", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customerName,
      billNumber,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (billNumber) query.billNumber = { $regex: billNumber, $options: 'i' };
    if (customerName) query['customer.name'] = { $regex: customerName, $options: 'i' };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const bills = await Bill.find(query)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      bills,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (err) {
    console.error("Fetch bills error:", err);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

// GET single bill
app.get("/api/bills/:id", async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bill" });
  }
});

// POST create bill
app.post("/api/bills", async (req, res) => {
  try {
    const { customer, items, taxRate, discount, notes, status = "Draft" } = req.body;

    // Validate required fields
    if (!customer.name || !customer.phone) {
      return res.status(400).json({ error: "Customer name and phone are required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    // Validate stock availability
    for (let item of items) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.product.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = (subtotal * discount) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    const tax = (discountedSubtotal * taxRate) / 100;
    const total = discountedSubtotal + tax;

    const billNumber = await generateUniqueBillNumber();

    const bill = new Bill({
      billNumber,
      customer,
      items,
      subtotal,
      tax,
      taxRate,
      discount,
      discountAmount,
      total,
      status,
      notes
    });

    await bill.save();

    // Update product stock if bill is paid
    if (status === 'Paid') {
      for (let item of items) {
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    io.emit("billCreated", bill);
    res.status(201).json(bill);
  } catch (err) {
    console.error("Create bill error:", err);
    res.status(500).json({ error: "Failed to create bill", details: err.message });
  }
});

// PUT update bill
app.put("/api/bills/:id", async (req, res) => {
  try {
    const oldBill = await Bill.findById(req.params.id);
    if (!oldBill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };
    
    // If status changes to paid, update stock
    if (oldBill.status !== 'Paid' && updateData.status === 'Paid') {
      for (let item of updateData.items || oldBill.items) {
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    const bill = await Bill.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    io.emit("billUpdated", bill);
    res.json(bill);
  } catch (err) {
    console.error("Update bill error:", err);
    res.status(500).json({ error: "Failed to update bill" });
  }
});

// DELETE bill
app.delete("/api/bills/:id", async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    // Restore stock if bill was paid
    if (bill.status === 'Paid') {
      for (let item of bill.items) {
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    // Delete PDF file if exists
    if (bill.pdfPath) {
      try {
        await fs.unlink(bill.pdfPath);
      } catch (err) {
        console.log("PDF file not found or already deleted");
      }
    }

    await Bill.findByIdAndDelete(req.params.id);
    
    io.emit("billDeleted", req.params.id);
    res.json({ message: "Bill deleted successfully" });
  } catch (err) {
    console.error("Delete bill error:", err);
    res.status(500).json({ error: "Failed to delete bill" });
  }
});

// Generate and save PDF
app.post("/api/bills/:id/generate-pdf", async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    const htmlContent = generateBillHTML(bill);
    
    // Create pdfs directory if it doesn't exist
    const pdfDir = path.join(process.cwd(), "pdfs");
    try {
      await fs.mkdir(pdfDir, { recursive: true });
    } catch (err) {
      // Directory already exists
    }

    const pdfPath = path.join(pdfDir, `${bill.billNumber}.pdf`);

    // Generate PDF using puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    
    await browser.close();

    // Update bill with PDF path
    bill.pdfPath = pdfPath;
    bill.pdfGenerated = true;
    await bill.save();

    res.json({ 
      message: "PDF generated successfully", 
      pdfPath: `/api/bills/${bill._id}/download-pdf`
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// Download PDF
app.get("/api/bills/:id/download-pdf", async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill || !bill.pdfPath) {
      return res.status(404).json({ error: "PDF not found" });
    }

    res.download(bill.pdfPath, `${bill.billNumber}.pdf`);
  } catch (err) {
    console.error("PDF download error:", err);
    res.status(500).json({ error: "Failed to download PDF" });
  }
});

// HTML template for PDF generation
function generateBillHTML(bill) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AutoNexus Bill - ${bill.billNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #dc2626; padding-bottom: 20px; }
        .company-name { font-size: 36px; font-weight: bold; color: #dc2626; margin-bottom: 5px; }
        .company-tagline { color: #666; font-size: 14px; margin-bottom: 10px; }
        .contact-info { font-size: 12px; color: #888; }
        .bill-info { display: flex; justify-content: space-between; margin: 30px 0; }
        .bill-details, .customer-info { background: #f8f9fa; padding: 20px; border-radius: 8px; width: 48%; }
        .section-title { font-size: 16px; font-weight: bold; color: #dc2626; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .label { font-weight: 600; }
        .table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .table th { background: #dc2626; color: white; font-weight: bold; }
        .table tbody tr:nth-child(even) { background: #f9f9f9; }
        .table tbody tr:hover { background: #f5f5f5; }
        .totals { margin-top: 30px; }
        .totals-table { width: 100%; max-width: 400px; margin-left: auto; }
        .totals-table td { border: 1px solid #ddd; padding: 10px; }
        .totals-table .total-row { background: #dc2626; color: white; font-weight: bold; font-size: 18px; }
        .notes { margin-top: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #666; }
        .status-badge { 
          display: inline-block; 
          padding: 4px 12px; 
          border-radius: 20px; 
          font-size: 12px; 
          font-weight: bold; 
        }
        .status-paid { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-draft { background: #d1ecf1; color: #0c5460; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-name">AutoNexus</div>
          <div class="company-tagline">Premium Automotive Parts & Solutions</div>
          <div class="contact-info">
            Email:autonexuscarsolutions@gmail.com | Phone: +94 743361910 | Web: https://autonexus.netlify.app/
          </div>
        </div>

        <!-- Bill and Customer Info -->
        <div class="bill-info">
          <div class="bill-details">
            <div class="section-title">Bill Details</div>
            <div class="info-row">
              <span class="label">Bill Number:</span>
              <span>${bill.billNumber}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span>${new Date(bill.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Time:</span>
              <span>${new Date(bill.createdAt).toLocaleTimeString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="status-badge status-${bill.status.toLowerCase()}">${bill.status}</span>
            </div>
          </div>

          <div class="customer-info">
            <div class="section-title">Customer Information</div>
            <div class="info-row">
              <span class="label">Name:</span>
              <span>${bill.customer.name}</span>
            </div>
            <div class="info-row">
              <span class="label">Phone:</span>
              <span>${bill.customer.phone}</span>
            </div>
            ${bill.customer.email ? `
            <div class="info-row">
              <span class="label">Email:</span>
              <span>${bill.customer.email}</span>
            </div>
            ` : ''}
            ${bill.customer.address ? `
            <div class="info-row">
              <span class="label">Address:</span>
              <span>${bill.customer.address}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Items Table -->
        <table class="table">
          <thead>
            <tr>
              <th style="width: 5%">#</th>
              <th style="width: 45%">Product</th>
              <th style="width: 10%">Qty</th>
              <th style="width: 20%">Unit Price</th>
              <th style="width: 20%">Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>
                <div style="font-weight: 600;">${item.product.name}</div>
                <div style="font-size: 12px; color: #666;">${item.product.brand || ''} ${item.product.category ? '- ' + item.product.category : ''}</div>
              </td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${item.unitPrice.toLocaleString()} LKR</td>
              <td style="text-align: right; font-weight: 600;">${item.totalPrice.toLocaleString()} LKR</td>
            </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">${bill.subtotal.toLocaleString()} LKR</td>
            </tr>
            ${bill.discount > 0 ? `
            <tr>
              <td>Discount (${bill.discount}%):</td>
              <td style="text-align: right; color: #dc2626;">-${bill.discountAmount.toLocaleString()} LKR</td>
            </tr>
            ` : ''}
            <tr>
              <td>Tax (${bill.taxRate}%):</td>
              <td style="text-align: right;">${bill.tax.toLocaleString()} LKR</td>
            </tr>
            <tr class="total-row">
              <td>Total Amount:</td>
              <td style="text-align: right;">${bill.total.toLocaleString()} LKR</td>
            </tr>
          </table>
        </div>

        <!-- Notes -->
        ${bill.notes ? `
        <div class="notes">
          <div class="section-title">Notes</div>
          <p>${bill.notes}</p>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>For any queries, please contact us atautonexuscarsolutions@gmail.com or +94 743361910</p>
          <p style="margin-top: 20px;">This is a computer-generated bill and does not require a physical signature.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Serve PDF files statically
app.use("/pdfs", express.static(path.join(process.cwd(), "pdfs")));

// Bill statistics
app.get("/api/bills/stats", async (req, res) => {
  try {
    const totalBills = await Bill.countDocuments();
    const paidBills = await Bill.countDocuments({ status: "Paid" });
    const pendingBills = await Bill.countDocuments({ status: "Pending" });
    const draftBills = await Bill.countDocuments({ status: "Draft" });
    
    const totalRevenue = await Bill.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    const monthlyRevenue = await Bill.aggregate([
      { 
        $match: { 
          status: "Paid",
          createdAt: { 
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          }
        } 
      },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    res.json({
      totalBills,
      paidBills,
      pendingBills,
      draftBills,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bill statistics" });
  }
});

// Socket.IO connection log
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected", socket.id));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));