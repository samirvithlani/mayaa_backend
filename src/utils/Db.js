const mongoose = require("mongoose")
const config = require("../config/config")

const dbConnection = async()=>{

    try{
        const connection = await mongoose.connect(config.DB_URL)
        if(connection){
            console.log(`database connected.`)
        }
        return connection
    }catch(err){

        return null
    }

}
module.exports = dbConnection