import { Order } from '../models/order.model.js';
import { Review } from '../models/review.model.js';
import { Product } from '../models/product.model.js';

export async function createReview(req, res) {

    try {
        const { productId, rating , orderId } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }
        const user = req.user;

        // verify order exist and is delivered
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized - You are not allowed to review this order" });
        }

        if(order.status !== "delivered") {
            return res.status(400).json({ message: "Order must be delivered to review" });
        }

        // verify product is in the order
        const productInOrder = order.orderItems.find(
            (item) => item.productId.toString() === productId.toString()
        );
        if (!productInOrder) {
            return res.status(400).json({ message: "Product not found in order" });
        }

        // check if review already exists
        const existingReview = await Review.findOne({
            productId,
            userId: user._id,
        });
        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this product" });
        }

        // create review
        const review = await Review.create({
            productId,
            userId: user._id,
            orderId,
            rating,
        });

        //  update the product ratings with atomic aggregation
        const reviews = await Review.find({ productId });
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                averageRating : totalRating / reviews.length,
                totalReviews : reviews.length,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedProduct) {
            await Review.findByIdAndDelete(review._id);
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(201).json({ message: "Review created successfully", review });
        
    } catch (error) {
        console.error("Error in createReview controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
export async function deleteReview(req, res) {

    try {
        const { reviewId } = req.params;
        const user = req.user;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        if(review.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized - You are not allowed to delete this review" });
        }

        // delete the review
        const productId = review.productId;
        await Review.findByIdAndDelete(reviewId);

        // update the product ratings
        const reviews = await Review.find({ productId });
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        await Product.findByIdAndUpdate(productId, {
            averageRating : reviews.length > 0 ? totalRating / reviews.length : 0,
            totalReviews : reviews.length,  
        });

        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Error in deleteReview controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }

}