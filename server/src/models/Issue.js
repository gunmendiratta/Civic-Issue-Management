import mongoose from 'mongoose'
const schema = new mongoose.Schema({ title:{type:String,required:true,trim:true,maxlength:120},category:{type:String,required:true},description:{type:String,required:true,maxlength:2000},location:{type:String,required:true,trim:true},severity:{type:String,enum:['Low','Medium','High','Critical'],default:'Medium'},status:{type:String,enum:['Reported','Under Review','In Progress','Resolved'],default:'Reported'},department:{type:String,default:'Unassigned'},imageUrl:String },{timestamps:true,versionKey:false})
schema.virtual('reference').get(function reference(){return `CC-${String(this._id).slice(-5).toUpperCase()}`})
schema.set('toJSON',{virtuals:true})
export default mongoose.model('Issue',schema)
