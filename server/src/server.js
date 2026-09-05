import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Issue from './models/Issue.js'
const app=express(),PORT=process.env.PORT||5000,root=path.dirname(fileURLToPath(import.meta.url))
const upload=multer({dest:path.join(root,'../uploads'),limits:{fileSize:5*1024*1024},fileFilter:(_req,file,cb)=>cb(null,/^image\/(jpeg|png|webp)$/.test(file.mimetype))})
app.use(cors());app.use(express.json());app.use('/uploads',express.static(path.join(root,'../uploads')))
app.get('/api/health',(_req,res)=>res.json({ok:true}))
app.get('/api/issues',async(_req,res,next)=>{try{res.json(await Issue.find().sort({createdAt:-1}))}catch(error){next(error)}})
app.post('/api/issues',upload.single('image'),async(req,res,next)=>{try{res.status(201).json(await Issue.create({...req.body,imageUrl:req.file?`/uploads/${req.file.filename}`:undefined}))}catch(error){next(error)}})
app.patch('/api/issues/:id',async(req,res,next)=>{try{const issue=await Issue.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!issue)return res.status(404).json({message:'Issue not found'});res.json(issue)}catch(error){next(error)}})
app.use((error,_req,res,_next)=>res.status(400).json({message:error.message||'Something went wrong'}))
mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/civicconnect').then(()=>app.listen(PORT,()=>console.log(`CivicConnect API listening on ${PORT}`))).catch((error)=>{console.error('MongoDB connection failed:',error.message);process.exit(1)})
