import { Router } from 'express';
import {
    createProduct,
    getAllProducts,
    updateProduct,
    getAllOrders,
    updateOrderStatus,
    getAllCustomers,
    getDashboardStats,
    deleteProduct
} from '../controllers/admin.controller.js';
import { protectRoute, adminOnly } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateOrderStatusSchema } from '../schemas/admin.schema.js';
import  upload  from '../middlewares/multer.middleware.js';
const router = Router();


// You can optimize this following code 

// router.post("/products", protectRoute , adminOnly ,createProduct);

// router.get("/products", protectRoute , adminOnly , getAllProducts);

// router.put("/products/:id", protectRoute , adminOnly , updateProduct);

router.use(protectRoute, adminOnly);

// products
router.post("/products", upload.array("images", 3), createProduct);
router.get("/products", getAllProducts);
router.put("/products/:id", upload.array("images", 3), updateProduct);
router.delete("/products/:id" , deleteProduct)

// orders
router.get("/orders", getAllOrders);
router.patch("/orders/:orderId/status", validate(updateOrderStatusSchema), updateOrderStatus);

// customers
router.get("/customers", getAllCustomers);
router.get("/stats", getDashboardStats);




export default router;
