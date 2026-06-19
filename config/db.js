const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb+srv://abhinandan_db_user:MqVfTUZp9pq1bR8G@cluster0.qtbcn0b.mongodb.net/fandgdummy?retryWrites=true&w=majority&appName=Cluster0";

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
        console.log(`MongoDB connected at ${instance}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

module.exports = {connectDB};
