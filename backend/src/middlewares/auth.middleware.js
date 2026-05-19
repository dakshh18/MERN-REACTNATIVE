import { requireAuth, clerkClient } from "@clerk/express";
import { User } from "../models/user.model.js";
import { ENV } from "../config/env.js";

export const protectRoute = [
    requireAuth(),
    async (req, res, next) => {
        try {
            const clerkId = req.auth().userId;
            if (!clerkId) {
                return res.status(401).json({ message: "Unauthorized - Invalid token" });
            }

            let user = await User.findOne({ clerkId });

            // Self-heal: if this is a first-time user (Inngest webhook didn't fire,
            // or isn't wired up), provision them in Mongo using their Clerk profile.
            // Upsert handles the race where two near-simultaneous first requests
            // from the same user both try to create.
            if (!user) {
                const clerkUser = await clerkClient.users.getUser(clerkId);
                const primaryEmail =
                    clerkUser.emailAddresses?.find(
                        (e) => e.id === clerkUser.primaryEmailAddressId
                    )?.emailAddress ??
                    clerkUser.emailAddresses?.[0]?.emailAddress;

                if (!primaryEmail) {
                    console.error(`[auth] Clerk user ${clerkId} has no email address`);
                    return res.status(400).json({
                        message: "Your account is missing an email address. Please add one in your profile and retry.",
                    });
                }

                user = await User.findOneAndUpdate(
                    { clerkId },
                    {
                        $setOnInsert: {
                            clerkId,
                            email: primaryEmail,
                            name:
                                `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
                                clerkUser.username ||
                                "User",
                            imageUrl: clerkUser.imageUrl || "",
                            addresses: [],
                            wishlist: [],
                        },
                    },
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
            }

            req.user = user;
            next();
        } catch (error) {
            console.error("Error in protectRoute middleware:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
];

export const adminOnly = (req, res, next) => {
    if(!req.user){
        return res.status(401).json({ message: "Unauthorized - User not found" });
    }
    if(req.user.email !== ENV.ADMIN_EMAIL){
        return res.status(403).json({ message: "Forbidden - Admin access only" });
    }
    next();
}