const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // For development, open to all origins
});

// Connect to MongoDB (local or MongoDB Atlas)
mongoose.connect("mongodb://localhost:27017/autonexus", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"));

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  originalPrice: Number,
  status: String,
  rating: Number,
  reviews: Number,
  image: String, // store image URL path
  badge: String,
  description: String,
});
const Product = mongoose.model("Product", productSchema);

// API Routes

// GET all products
app.get("/api/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// POST create product + image upload
app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const data = req.body;
    const product = new Product({
      ...data,
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      rating: Number(data.rating),
      reviews: Number(data.reviews),
      image: req.file ? `/uploads/${req.file.filename}` : "",
    });
    await product.save();
    io.emit("productCreated", product); // Realtime notification
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// PUT update product + image upload
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const data = req.body;
    const updateData = {
      ...data,
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      rating: Number(data.rating),
      reviews: Number(data.reviews),
    };
    if (req.file) updateData.image = `/uploads/${req.file.filename}`;

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    io.emit("productUpdated", product);
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    io.emit("productDeleted", req.params.id);
    res.json({ message: "Product deleted" });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete product" });
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
