require('dotenv').config();

module.exports = {
    connectionString: process.env.MONGO_URI,
};
