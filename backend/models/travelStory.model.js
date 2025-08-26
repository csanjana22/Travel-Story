const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const travelStorySchema = new Schema({
    title:{ type: String, required: true },
    story: { type: String, required: true },
    visitedLocation: {
        name: { type: String, required: true },
        lat: { type: Number },
        lng: { type: Number }
    },
    userId:{ type:Schema.Types.ObjectId, ref:"User",required:true},
    createdOn: { type: Date, default: Date.now },
    imageUrls: { type: [String], default: [] },
    visitedDate: { type: Date, required: true },
    isFavourite: { type: Boolean, default: false },
    visibility:{type:String,enum:['public','private'],default: 'private'}
});

module.exports = mongoose.model('TravelStory', travelStorySchema);