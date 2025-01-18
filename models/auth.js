import mongoose from "mongoose";
 
const loginHistorySchema = new mongoose.Schema({
   browser: { type: String },
   os: { type: String },
   deviceType: { type: String },
   ipAddress: { type: String },
   time: { type: Date, default: Date.now }, // Login time
});



const userschema=mongoose.Schema({
    avatar:{type: String, default: null},
    name:{type:String,required:true},
    email:{type:String,required:true},
    password:{type:String,required:true},
    about:{type:String},
    tags:{type:[String]},
    joinedon:{type:Date,default:Date.now},
    notificationPreference: { type: Boolean, default: true },
    loginHistory: [loginHistorySchema], // Add loginHistory as an array of objects

 })

 export default mongoose.model("User",userschema)