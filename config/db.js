const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb://fandgadmin:Fandg1234@50.172.153.160.host.secureserver.net:27017/database?authSource=admin";
const connectDB = async () => {
    try {
        const mongooseOptions = {
            serverSelectionTimeoutMS: 15000,
        };

        // Windows local dev: antivirus/proxy SSL inspection causes
        // "unable to verify the first certificate" (not an IP whitelist issue).
        if (
            process.env.MONGO_TLS_ALLOW_INVALID === "true" ||
            process.env.NODE_ENV !== "production"
        ) {
            mongooseOptions.tlsAllowInvalidCertificates = true;
        }

        const connect = await mongoose.connect(MONGO_URI, mongooseOptions);
        const instance = connect.connection.host;
        console.log(`MongoDB connected at ${instance} (db: ${mongoose.connection.name})`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

module.exports = {connectDB};
