const express = require("express")
const  mongoose = require("mongoose")
require("dotenv").config();

const defaultFields = require("./src/plugins/defaultFields");
mongoose.plugin(defaultFields);
const cors = require("cors")
const config = require("./src/config/config");
const dbConnection = require("./src/utils/Db");
const app = express()
dbConnection()
app.use(cors())
app.use(express.json())

const authRoutes = require("./src/routes/AuthRoutes")
app.use("/auth",authRoutes)
const roleRoutes = require("./src/routes/RoleRoutes")
app.use("/role",roleRoutes)
const productCategoryRoutes = require("./src/routes/ProductCategoryRoutes")
app.use("/product-category",productCategoryRoutes)
const productSubCategoryRoutes = require("./src/routes/ProductSubCategoryRoutes")
app.use("/product-sub-category",productSubCategoryRoutes)
const cartRoutes = require("./src/routes/UserCartRoutes")
app.use("/cart",cartRoutes)

const productRoutes = require("./src/routes/ProductRoutes")
app.use("/product",productRoutes)

const productImportRoutes = require("./src/routes/ProductImportRoutes");
app.use("/productimport",productImportRoutes)

const addressRoutes = require("./src/routes/AddressRoutes")
app.use("/address",addressRoutes)

const locationRoutes = require("./src/routes/locationRoutes")
app.use("/location",locationRoutes)

const orderRoutes = require("./src/routes/OrderRoutes")
app.use("/order",orderRoutes)

const PORT = config.PORT || 3000
app.listen(PORT,()=>{
    console.log(`server started on port ${PORT}`);
    
})