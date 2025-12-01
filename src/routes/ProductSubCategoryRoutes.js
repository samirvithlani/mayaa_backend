const router = require('express').Router();
const productSubCategoryController = require('../controllers/ProductSubCategoryController');
router.post('/', productSubCategoryController.createProductSubCategory);
router.get('/', productSubCategoryController.getAllProductSubCategories);
router.get('/:id', productSubCategoryController.getProductSubCategoryById);
router.put('/:id', productSubCategoryController.updateProductSubCategory);
router.delete('/:id', productSubCategoryController.deleteProductSubCategory);
router.get('/category/:id', productSubCategoryController.getAllSubCategoriesByCategoryId);
module.exports = router;