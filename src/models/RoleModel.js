const mongoose = require("mongoose")
const Schmea = mongoose.Schema
const roleModel = new Schmea({
    name:{
        type:String,
        unique:true
    },
})
roleModel.pre("findOneAndDelete", async function (next) {
  const roleId = this.getQuery()._id;

  // import affected models
  //const User = mongoose.model("User");
  

  // Delete related data
  //await User.deleteMany({ role: roleId });
  

  next();
});

module.exports = mongoose.model("Role",roleModel)