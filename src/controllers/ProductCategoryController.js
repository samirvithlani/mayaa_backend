const ProductCategory = require('../models/ProductCategoryModel');
const ProductSubCategory = require('../models/ProductSubCategoryModel');
const createProductCategory = async (req, res) => {
    try {
        const productCategory = await ProductCategory.create(req.body);
        res.status(201).json({
            message: 'Product category created successfully',
            data: productCategory
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating product category',
            error: error.message
        });
    }
}
const getAllProductCategories = async (req, res) => {
    try {
        const productCategories = await ProductCategory.find();
        res.status(200).json({
            message: 'Product categories fetched successfully',
            data: productCategories
        }); 
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching product categories',
            error: error.message
        });
    }
}
const getProductCategoryById = async (req, res) => {
    try {
        const productCategory = await ProductCategory.findById(req.params.id);
        res.status(200).json({
            message: 'Product category fetched successfully',
            data: productCategory
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching product category',
            error: error.message
        });
    }
}
const updateProductCategory = async (req, res) => { 
    try {
        const productCategory = await ProductCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({
            message: 'Product category updated successfully',
            data: productCategory
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating product category',
            error: error.message
        });
    }
}
const deleteProductCategory = async (req, res) => {
    try {
        const productCategory = await ProductCategory.findByIdAndDelete(req.params.id);
        res.status(200).json({
            message: 'Product category deleted successfully',
            data: productCategory
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error deleting product category',
            error: error.message
        });
    }
}
module.exports = {
    createProductCategory,getAllProductCategories,getProductCategoryById,updateProductCategory,deleteProductCategory
}