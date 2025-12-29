const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(`mongodb://fandgadmin:Fandg1234@50.172.153.160.host.secureserver.net:27017/database?authSource=admin`);
        // const connect = await mongoose.connect(`mongodb+srv://jitnishantsharma:${process.env.DB_PASSWORD}@cluster0.gvk973f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`);
        const instance = connect.connection.host;
        console.log(`MongoDB connected at ${instance}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

module.exports = {connectDB};