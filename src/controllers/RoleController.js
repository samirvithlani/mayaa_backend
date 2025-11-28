const roleModel = require("../models/RoleModel")

const createRole = async(req,res)=>{

    try{
        const savedRole = await roleModel.create(req.body)
        res.status(201).json({
            message:"role saved successfully",
            data:savedRole
        })
    }
    catch(err){
        res.status(500).json({
            message:"error while creating role",
            err:err
        })
    }
}
const getAllRoles = async (req, res) => {
    try {
        const roles = await roleModel.find().sort({ createdAt: -1 }); // latest first (optional)

        if (!roles || roles.length === 0) {
            return res.status(404).json({
                message: "No roles found",
                data: []
            });
        }

        res.status(200).json({
            message: "Roles fetched successfully",
            data: roles
        });
    } catch (err) {
        res.status(500).json({
            message: "Error while fetching roles",
            error: err.message
        });
    }
};

module.exports = {
    createRole,getAllRoles
}