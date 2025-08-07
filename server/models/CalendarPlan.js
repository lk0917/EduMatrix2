const mongoose = require("mongoose");

const CalendarPlanSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  date: { type: String, required: true }, 
  topic: { type: String, required: true },
  goal: { type: String, required: true },
  description: { type: String, required: true },
  field: { type: String, required: true },
}, {
  timestamps: true
});

module.exports = mongoose.model("CalendarPlan", CalendarPlanSchema);