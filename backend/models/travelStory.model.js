const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const travelStorySchema = new Schema({
    title:{ type: String, required: true },
    story: { type: String, required: true },
    visitedLocation: { type: [String],default:[]},
    userId:{ type:Schema.Types.ObjectId, ref:"User",required:true},
    createdOn: { type: Date, default: Date.now },
    imageUrls: { type: [String], default: [] },
    visitedDate: { type: Date, required: true },
    isFavourite: { type: Boolean, default: false }
});

module.exports = mongoose.model('TravelStory', travelStorySchema);