import { User } from "../models/user.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

export const addAddress = async (req, res) => {

    try {
        const { label, fullName, streetAddress, city, state, zipCode, phoneNumber, isDefault } = req.body;

        const user = req.user;
        if (!fullName || !streetAddress || !city || !state || !zipCode || !phoneNumber) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (String(phoneNumber).length !== 10) {
            return res.status(400).json({ message: "Phone number must be 10 digits" });
        }
        if (String(zipCode).length !== 6) {
            return res.status(400).json({ message: "Zip code must be 6 digits" });
        }

        // if this is set as default , then we need to unset the other default addresses
        if (isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            })
        }
        user.addresses.push({
            label,
            fullName,
            streetAddress,
            city,
            state,
            zipCode,
            phoneNumber,
            isDefault: isDefault || false
        });
        await user.save();
        return res.status(201).json({ message: "Address added successfully", address: user.addresses });
    } catch (error) {
        console.error("Error in addAddress controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const getAddresses = async (req, res) => {
    try {
        const user = req.user;

        res.status(200).json({ message: "Addresses fetched successfully", addresses: user.addresses });

    } catch (error) {
        console.error("Error in getAddresses controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const updateAddress = async (req, res) => {
    try {
        const { label, fullName, streetAddress, city, state, zipCode, phoneNumber, isDefault } = req.body;

        const { addressId } = req.params;
        const user = req.user;
        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        if (isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            })
        }

        address.label = label || address.label;
        address.fullName = fullName || address.fullName;
        address.streetAddress = streetAddress || address.streetAddress;
        address.city = city || address.city;
        address.state = state || address.state;
        address.zipCode = zipCode || address.zipCode;
        address.phoneNumber = phoneNumber || address.phoneNumber;
        address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;
        await user.save();

        res.status(200).json({ message: "Address updated successfully", address: user.addresses });
    } catch (error) {

        console.error("Error in updateAddress controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}


export const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = req.user;
        user.addresses.pull(addressId);
        await user.save();
        res.status(200).json({ message: "Address deleted successfully", addresses: user.addresses });
    } catch (error) {
        console.error("Error in deleteAddress controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        // check if the product is already in the wishlist
        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ error: "Product already in wishlist" });
        }
        user.wishlist.push(productId);
        await user.save();
        res.status(200).json({ message: "Product added to wishlist successfully", wishlist: user.wishlist });
    } catch (error) {
        console.error("Error in addToWishlist controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        // basically when you want to remove an item you would sent the id in the params,
        // but if you are adding something you would send the id in the req.body
        const user = req.user;

        // check if the product is already in the wishlist
        if (!user.wishlist.includes(productId)) {
            return res.status(400).json({ error: "Product is not even in the wishlist" });
        }

        user.wishlist.pull(productId);
        await user.save();
        res.status(200).json({ message: "Product removed from wishlist successfully", wishlist: user.wishlist });
    } catch (error) {
        console.error("Error in removeFromWishlist controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });

    }
}

export const registerPushToken = async (req, res) => {
    try {
        const { pushToken } = req.body;
        if (!pushToken || typeof pushToken !== 'string') {
            return res.status(400).json({ message: 'pushToken is required' });
        }
        const user = req.user;
        if (!user.pushTokens.includes(pushToken)) {
            user.pushTokens.push(pushToken);
            await user.save();
        }
        return res.status(200).json({ message: 'Push token registered' });
    } catch (error) {
        console.error('Error in registerPushToken controller:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export const getWishlist = async (req, res) => {
    try {
        // basically we are fetching the user and then we are fetching the wishlist from the user
        const user = await User.findById(req.user._id).populate("wishlist");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Wishlist fetched successfully", wishlist: user.wishlist });
    } catch (error) {
        console.error("Error in getWishlist controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
        
    }
 }
