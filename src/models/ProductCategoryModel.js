const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ProductSubCategory = require('./ProductSubCategoryModel');
const productCategorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
})
module.exports = mongoose.model('ProductCategory', productCategorySchema);
productCategorySchema.pre('findOneAndDelete', async function (next) {
    const productCategoryId = this.getQuery()._id;
    await ProductSubCategory.deleteMany({ productCategoryId: productCategoryId });
    next();
});