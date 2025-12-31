import { Cart } from '../models/cart.model.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';

export async function getCart(req, res) {
    try {
        let cart = await Cart.findOne({ clerkId: req.user.clerkId }).populate('items.productId');
        if (!cart) {
            const user = req.user;
            cart = await Cart.create({
                user: user._id,
                clerkId: user.clerkId,
                items: [],
            });
        }
        res.status(200).json({ message: "Cart fetched successfully", cart });
    } catch (error) {
        console.error("Error in getCart controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export async function addToCart(req, res) {
    try {
        const { productId, quantity = 1 } = req.body;
        // validate product exist and has stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: "Insufficient stock" });
        }

        let cart = await Cart.findOne({ clerkId: req.user.clerkId });
        if (!cart) {
            const user = req.user;
            cart = await Cart.create({
                user: user._id,
                clerkId: user.clerkId,
                items: [],
            });
        }

        // check if item already in cart
        const existingItem = cart.items.find((item) => item.product.toString() === productId);
        if (existingItem) {
            // increment quantity by 1 
            const newQuantity = existingItem.quantity + 1;
            if (product.stock < newQuantity) {
                return res.status(400).json({ message: "Insufficient stock" });
            }
            existingItem.quantity = newQuantity;
        } else {
            // add new item to cart
            cart.items.push({
                product: product._id,
                quantity,
            });
        }
        await cart.save();
        res.status(200).json({ message: "Item added to cart successfully", cart });
    } catch (error) {
        console.error("Error in addToCart controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export async function updateCartItem(req, res) {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1" });
        }
        const cart = await Cart.findOne({ clerkId: req.user.clerkId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        // validate product exist and has stock

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: "Insufficient stock" });
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        res.status(200).json({ message: "Cart item updated successfully", cart });
    } catch (error) {
        console.error("Error in updateCartItem controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export async function removeFromCart(req, res) {
    try {
        const { productId } = req.params;
        const cart = await Cart.findOne({ clerkId: req.user.clerkId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = cart.items.filter((item) => item.product.toString() !== productId);
        await cart.save();
        res.status(200).json({ message: "Item removed from cart successfully", cart });

    } catch (error) {
        console.error("Error in removeFromCart controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export async function clearCart(req, res) {

    try {
        const cart = await Cart.findOne({ clerkId: req.user.clerkId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        cart.items = [];
        await cart.save();
        res.status(200).json({ message: "Cart cleared successfully", cart });
    } catch (error) {
        console.error("Error in clearCart controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
 }