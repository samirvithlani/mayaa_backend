const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const productSubCategorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    productCategoryId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductCategory',
        required: true
    }
})
module.exports = mongoose.model('ProductSubCategory', productSubCategorySchema);
productSubCategorySchema.pre('findOneAndDelete', async function (next) {
    const productSubCategoryId = this.getQuery()._id;
   // await Product.deleteMany({ productSubCategoryId: productSubCategoryId });
    next();
});
