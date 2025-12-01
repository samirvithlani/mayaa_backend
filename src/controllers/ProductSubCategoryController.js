const ProductSubCategory = require('../models/ProductSubCategoryModel');
const createProductSubCategory = async (req, res) => {
    try {
        const productSubCategory = await ProductSubCategory.create(req.body);
        res.status(201).json({
            message: 'Product sub category created successfully',
            data: productSubCategory
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating product sub category',
            error: error.message
        });
    }
}
const getAllProductSubCategories = async (req, res) => {
    try {
        const productSubCategories = await ProductSubCategory.find().populate("productCategoryId");
        res.status(200).json({
            message: 'Product sub categories fetched successfully',
            data: productSubCategories
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching product sub categories',
            error: error.message
        });
    }
}
const getProductSubCategoryById = async (req, res) => {
    try {
        const productSubCategory = await ProductSubCategory.findById(req.params.id);
        res.status(200).json({
            message: 'Product sub category fetched successfully',
            data: productSubCategory
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching product sub category',
            error: error.message
        });
    }
}
const updateProductSubCategory = async (req, res) => {
    try {
        const productSubCategory = await ProductSubCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({
            message: 'Product sub category updated successfully',
            data: productSubCategory
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating product sub category',
            error: error.message
        });
    }
}
const deleteProductSubCategory = async (req, res) => {
    try {
        const productSubCategory = await ProductSubCategory.findByIdAndDelete(req.params.id);
        res.status(200).json({
            message: 'Product sub category deleted successfully',
            data: productSubCategory
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting product sub category',
            error: error.message
        });
    }
}
const getAllSubCategoriesByCategoryId = async (req, res) => {
    try {
        const productSubCategories = await ProductSubCategory.find({ productCategoryId: req.params.id });
        res.status(200).json({
            message: 'Product sub categories fetched successfully',
            data: productSubCategories
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error fetching product sub categories',
            error: error.message
        });
    }
}
module.exports = {
    createProductSubCategory,getAllProductSubCategories,getProductSubCategoryById,updateProductSubCategory,deleteProductSubCategory,getAllSubCategoriesByCategoryId
}