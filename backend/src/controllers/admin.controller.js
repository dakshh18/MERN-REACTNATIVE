import cloudinary from '../config/cloudinary.js';
import { Product } from '../models/product.model.js';
import { Order } from '../models/order.model.js';
import { User } from '../models/user.model.js';

export async function createProduct(req, res) {

    try {
        const { name, description, price, stock, category } = req.body;

        if (!name || !description || !price || !stock || !category) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        if (req.files.length > 3) {
            return res.status(400).json({ message: "You can only upload up to 3 images" });
        }

        // image upload to cloudinary
        const uploadPromises = req.files.map((file) => {
            return cloudinary.uploader.upload(file.path, {
                folder: "products",
            })
        })
        const uploadResults = await Promise.all(uploadPromises);
        // secure urls
        const imageUrls = uploadResults.map((result) => result.secure_url);

        // create product
        const product = await Product.create({
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
            category,
            images: imageUrls,
        })

        res.status(201).json({
            message: "Product created successfully",
            product,
        })

    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        })
    }

}

export async function getAllProducts(req, res) {
    try {
        // Extract pagination parameters from query string
        // page: which page to fetch (default: 1)
        // limit: how many items per page (default: 10)
        // Example: /api/products?page=2&limit=20
        const page = parseInt(req.query.page) || 1; // Convert to number, default to page 1
        const limit = parseInt(req.query.limit) || 10; // Convert to number, default to 10 items per page

        // Calculate how many documents to skip
        // For page 1: skip 0 documents (show first 10)
        // For page 2: skip 10 documents (show next 10)
        // For page 3: skip 20 documents (show next 10)
        // Formula: skip = (page - 1) * limit
        const skip = (page - 1) * limit;

        // Fetch products with pagination
        // .skip(skip): Skip the first 'skip' number of documents
        // .limit(limit): Only return 'limit' number of documents
        // .sort({ createdAt: -1 }): Sort by creation date in descending order (-1 means newest first)
        const products = await Product.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count of all products (for pagination metadata)
        // This helps frontend know how many total pages exist
        const totalProducts = await Product.countDocuments();

        // Calculate total pages needed
        // Math.ceil rounds up: if we have 25 products and limit is 10, we need 3 pages
        const totalPages = Math.ceil(totalProducts / limit);

        // Check if there are more pages available
        const hasNextPage = page < totalPages;
        // Check if there is a previous page
        const hasPrevPage = page > 1;

        res.status(200).json({
            message: "Products fetched successfully",
            products,
            // Pagination metadata for frontend
            pagination: {
                currentPage: page,        // Current page number
                totalPages: totalPages,   // Total number of pages
                totalProducts: totalProducts, // Total number of products in database
                limit: limit,            // Items per page
                hasNextPage: hasNextPage, // Boolean: can go to next page?
                hasPrevPage: hasPrevPage, // Boolean: can go to previous page?
            }
        })

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        })
    }

}

export async function updateProduct(req, res) {

    try {
        const { id } = req.params;
        const { name, description, price, stock, category } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (name) product.name = name;
        if (description) product.description = description;
        if (price) product.price = parseFloat(price);
        if (stock !== undefined) product.stock = parseInt(stock);
        if (category) product.category = category;

        // handle image updates if new images are provided
        if (req.files && req.files.length > 0) {
            if (req.files.length > 3) {
                return res.status(400).json({ message: "You can only upload up to 3 images" });
            }

            const uploadPromises = req.files.map((file) => {
                return cloudinary.uploader.upload(file.path, {
                    folder: "products",
                })
            })
            const uploadResults = await Promise.all(uploadPromises);
            product.images = uploadResults.map((result) => result.secure_url);
        }

    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        })

    }

}

export async function getAllOrders(req, res) {
    try {
        // what is populate ? why we use it ? 
        //  havee order wada model ma we have this user:{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true,}
        //  but khali id thi apde shu kariye ? so mongo db nu feature che aa ke id par thi 
        // apda ne user model ma je hoi aeno access made like name and email 

        const orders = await Order.find()
            .populate("user", "name email")
            .populate("orderItems.product")
            .sort({ createdAt: -1 });
        res.status(200).json({
            message: "Orders fetched successfully",
            orders,
        })
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        })
    }
}

export async function updateOrderStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!status || !['pending', 'shipped', 'delivered'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        order.status = status;
        if (status === 'shipped' && !order.shippedAt) {
            order.shippedAt = new Date();
        }
        if (status === 'delivered' && !order.deliveredAt) {
            order.deliveredAt = new Date();
        }
        await order.save();
        res.status(200).json({
            message: "Order status updated successfully",
            order,
        })
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        })
    }
}

export async function getAllCustomers(req, res) {
    try {
        const customers = await User.find().sort({ createdAt: -1 });
        res.status(200).json({
            message: "Customers fetched successfully",
            customers,
        })

    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        })
    }
}

export async function getDashboardStats(req, res) {

    try {
        const totalOrders = await Order.countDocuments(); // mongo db provides countDocuments method to count the number of documents in a collection

        const revenueResult = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalPrice" },
                }
            }
        ])

        const totalRevenue = revenueResult[0]?.total || 0;

        const totalCustomers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();

        res.status(200).json({
            message: "Dashboard stats fetched successfully",
            totalRevenue,
            totalOrders,
            totalCustomers,
            totalProducts,
        })

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        })

    }

}