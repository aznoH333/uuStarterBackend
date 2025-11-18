const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://categories-db:27017/categories', {});

// Category
const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
});
const Category = mongoose.model("Category", CategorySchema);


module.exports = { CategorySchema, Category }