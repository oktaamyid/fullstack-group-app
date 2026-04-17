const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/apiResponse');
const { createWishlistSchema, updateWishlistSchema } = require('../validators/wishlistValidator');

function logWishlistWarning(event, req, details = {}) {
  console.warn('[wishlist-warning]', {
    event,
    userId: req.user?.id || null,
    method: req.method,
    path: req.originalUrl,
    details,
  });
}

async function listWishlists(req, res) {
  try {
    const wishlists = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      orderBy: [{ priorityScore: 'desc' }, { createdAt: 'desc' }],
    });

    return sendSuccess(res, { wishlists }, 'Wishlist fetched successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch wishlist', 500, {
      error: error.message,
    });
  }
}

async function createWishlist(req, res) {
  const validation = createWishlistSchema.safeParse(req.body);
  if (!validation.success) {
    logWishlistWarning('validation_failed_create', req, {
      errors: validation.error.flatten().fieldErrors,
    });

    return sendError(res, 'Validation failed', 422, {
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const { item, price, priorityScore } = validation.data;

  try {
    const wishlist = await prisma.wishlist.create({
      data: {
        userId: req.user.id,
        item,
        price,
        priorityScore,
      },
    });

    return sendSuccess(res, { wishlist }, 'Wishlist item created successfully', 201);
  } catch (error) {
    return sendError(res, 'Failed to create wishlist item', 500, {
      error: error.message,
    });
  }
}

async function updateWishlist(req, res) {
  const wishlistId = Number(req.params.id);
  if (Number.isNaN(wishlistId)) {
    logWishlistWarning('invalid_wishlist_id_update', req, {
      id: req.params.id,
    });

    return sendError(res, 'Invalid wishlist id', 400);
  }

  const validation = updateWishlistSchema.safeParse(req.body);
  if (!validation.success) {
    logWishlistWarning('validation_failed_update', req, {
      wishlistId,
      errors: validation.error.flatten().fieldErrors,
    });

    return sendError(res, 'Validation failed', 422, {
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const existing = await prisma.wishlist.findFirst({
      where: {
        id: wishlistId,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return sendError(res, 'Wishlist item not found', 404);
    }

    const wishlist = await prisma.wishlist.update({
      where: { id: wishlistId },
      data: validation.data,
    });

    return sendSuccess(res, { wishlist }, 'Wishlist item updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update wishlist item', 500, {
      error: error.message,
    });
  }
}

async function deleteWishlist(req, res) {
  const wishlistId = Number(req.params.id);
  if (Number.isNaN(wishlistId)) {
    logWishlistWarning('invalid_wishlist_id_delete', req, {
      id: req.params.id,
    });

    return sendError(res, 'Invalid wishlist id', 400);
  }

  try {
    const existing = await prisma.wishlist.findFirst({
      where: {
        id: wishlistId,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return sendError(res, 'Wishlist item not found', 404);
    }

    await prisma.wishlist.delete({
      where: { id: wishlistId },
    });

    return sendSuccess(res, {}, 'Wishlist item deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete wishlist item', 500, {
      error: error.message,
    });
  }
}

module.exports = {
  listWishlists,
  createWishlist,
  updateWishlist,
  deleteWishlist,
};
