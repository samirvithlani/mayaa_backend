const router = require('express').Router();
const productCategoryController = require('../controllers/ProductCategoryController');
router.post('/', productCategoryController.createProductCategory);
router.get('/', productCategoryController.getAllProductCategories);
router.get('/:id', productCategoryController.getProductCategoryById);
router.put('/:id', productCategoryController.updateProductCategory);
router.delete('/:id', productCategoryController.deleteProductCategory);
module.exports = router;