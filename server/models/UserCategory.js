const mongoose = require("mongoose");

if (mongoose.models.UserCategory) {
  delete mongoose.models.UserCategory;
}

const UserCategorySchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  categories: { type: [String], default: ["기본"] }
});

module.exports = mongoose.model("UserCategory", UserCategorySchema);
