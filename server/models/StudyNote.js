const mongoose = require("mongoose");

if(mongoose.models.StudyNote) {
    delete mongoose.models.StudyNote;
}

const StudyNoteSchema = new mongoose.Schema({
    user_id: { type : Number, required : true },
    title : { type : String, required : true },
    content: { type : String, required : true},
    images:{ type : [String], default: []},
    tables: {
    type: [
        {
            headers: [String],
            rows: [[String]],
        }
    ],
    default : []
    },
    date : {type: Date, default: Date.now}
}, {
    timestamps: true
});

StudyNoteSchema.pre('findOneAndUpdate', function(next) {
  this._update.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("StudyNote",StudyNoteSchema);