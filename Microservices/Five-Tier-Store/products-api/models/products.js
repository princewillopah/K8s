const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  product: String,
  image: String,
  price: Number,
  description: String,
});

const ProductModel = mongoose.model("Product", productSchema);

module.exports = ProductModel;
