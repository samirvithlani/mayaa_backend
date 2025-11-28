const router = require("express").Router()
const roleController = require("../controllers/RoleController")
router.post("/",roleController.createRole)
router.get("/",roleController.getAllRoles)
module.exports = router