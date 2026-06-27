const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const wishlistController = require('../controllers/wishlistController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', wishlistController.listWishlists);
router.post('/', wishlistController.createWishlist);
router.patch('/:id', wishlistController.updateWishlist);
router.delete('/:id', wishlistController.deleteWishlist);
router.post('/:id/savings', wishlistController.addSavings);

module.exports = router;
