const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
    time: String,
    activity_name: String,
    estimated_cost: Number,
    description: String
}, { _id: false });

const ItinerarySchema = new Schema({
    userId:{ type:Schema.Types.ObjectId, ref:"User",required:true},
    destination: { type: String, required: true , trim: true},
    days: {type: Number, required:true, min:1},
    budget:{type: Number, required:true , min:0},
    interests: {type:String,trim:true,default:""},
    itineraryData: {
        grand_total_estimated_cost: Number,
        budget_optimization_notes: String,
        itinerary: [{
            day: Number,
            daily_total: Number,
            activities: [ActivitySchema]
        }]
    },
    summary: { type: String, default: "" },
    feedbackHistory: {type:[String],default: []},
    createdAt: { type: Date, default: Date.now }
    },
    {timestamps:true}
);

module.exports = mongoose.model('Itinerary', ItinerarySchema);
