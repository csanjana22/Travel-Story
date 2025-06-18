const moongoose = require('mongoose');
const Schema = moongoose.Schema;

const userSchema =  new Schema({
    fullName:{type:String ,required:true},
    email:{type:String ,required:true, unique:true},
    password:{type:String ,required:true},
    createdOn:{type:Date ,default:Date.now}    
});

module.exports= moongoose.model('User',userSchema);