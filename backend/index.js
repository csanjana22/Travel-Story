require('dotenv').config();
const config = require('./config');
const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');

const {authenticateToken} = require('./utilities');
const {single, array} = require('./multer');
const fs = require('fs');
const path = require('path');

const User = require('./models/user.model');
const TravelStory = require('./models/travelStory.model');
const { error } = require('console');
mongoose.connect(config.connectionString);

const app = express();
app.use(express.json());
app.use(cors({origin:"*"}));

//Create account
app.post("/create-account", async(req,res)=>{
    const {fullName,email,password}=req.body;
    
    if (!fullName || !email || !password){
        return res
        .status(400)
        .json({error:true ,message:"All fields are required"});        
    }

    const isUser = await User.findOne({email});
    if (isUser){
        return res
        .status(400)
        .json({error:true ,message:"User already exists"});         
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const user = new User({
        fullName,
        email,
        password:hashedPassword
    });

    await user.save();

    const accessToken = jwt.sign(
        {userId:user._id},//.userId,
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:"72h"}
    );

    return res.status(201).json({
        error:false,
        user:{fullName:user.fullName,email:user.email},
        accessToken,
        message:"Registration Successfull"
    });
});

//Login
app.post("/login", async(req,res)=>{
    const {email,password} = req.body;

    if (!email || !password){
        return res.status(400).json({message:"All fields are required",error:true});
    }

    const user = await User.findOne({email});
    if (!user){
        return res.status(400).json({message:"User not found",error:true});
    }

    const isPasswordValid = await bcrypt.compare(password,user.password);
    if (!isPasswordValid){
        return res.status(400).json({message:"Invalid credentials",error:true});
    }

    const accessToken = jwt.sign(
        {userId:user._id},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:"72h"}
    );

    return res.status(200).json({
        error:false,
        user:{fullName:user.fullName,email:user.email},
        message:"Login Successfull",
        accessToken
    })
});   

//Get user details
app.get("/get-user", authenticateToken, async(req,res)=>{
    const {userId} = req.user;

    const isUser = await User.findOne({_id:userId});
    if (!isUser){
        return res.status(404).json({error:true, message:"User not found"});
    }

    return res.json({
        user:isUser,
        message:"",
    });
});

//Route to handle image upload
app.post("/image-upload", array, async(req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: true, message: "No images uploaded" });
        }
        
        // Handle both single and multiple file uploads
        const files = Array.isArray(req.files) ? req.files : [req.files];
        const imageUrls = files.map(file => `http://localhost:8000/uploads/${file.filename}`);
        
        res.status(200).json({ imageUrls });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

//Delete images from uploads directory
app.delete("/delete-images", async(req, res) => {
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls)) {
        return res.status(400).json({ error: true, message: "Image URLs array is required" });
    }

    try {
        const deletePromises = imageUrls.map(imageUrl => {
            const filename = path.basename(imageUrl);
            const filePath = path.join(__dirname, 'uploads', filename);
            
            return new Promise((resolve, reject) => {
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                } else {
                    resolve(); // File doesn't exist, consider it deleted
                }
            });
        });

        await Promise.all(deletePromises);
        return res.status(200).json({ message: "Images deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

// Serve static files from the uploads assets directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

//Add Travel Story
app.post("/add-travel-story", authenticateToken, async(req, res) => {
    let { title, story, visitedLocation, imageUrls, visitedDate } = req.body;
    const { userId } = req.user;
    
    if (!title || !story || !visitedLocation || !visitedDate) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        imageUrls = [`http://localhost:8000/assets/placeholder.png`];
    }

    //Convert visitedDate to Date object
    const parsedVisitedDate = new Date(parseInt(visitedDate));

    try {
        const travelStory = new TravelStory({
            userId,
            title,
            story,
            visitedLocation,
            imageUrls,
            visitedDate: parsedVisitedDate,
        });

        await travelStory.save();
        res.status(201).json({ story: travelStory, error: false, message: "Added successfully" });
    } catch (error) {
        res.status(400).json({ error: true, message: error.message });
    }
});

//Get All Travel Stories
app.get("/get-all-travel-stories", authenticateToken, async(req,res)=>{
    const {userId} = req.user;

    try{
        const travelStories = await TravelStory.find({userId:userId}).sort({isFavourite:-1});
        res.status(200).json({stories:travelStories, error:false, message:"Travel stories fetched successfully"});
    } catch(error){
        res.status(400).json({error:true, message:error.message});
    }
});

//Edit Travel Story
app.put("/edit-story/:id", authenticateToken, async(req, res) => {
    const { id } = req.params;
    const { title, story, visitedLocation, visitedDate, imageUrls } = req.body;
    const { userId } = req.user;

    if (!title || !story || !visitedLocation || !visitedDate) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    //Convert visitedDate to Date object
    const parsedVisitedDate = new Date(parseInt(visitedDate));
    
    try {
        //Find the travel story by ID and ensure it belongs to the authenticated user
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

        if (!travelStory) {
            return res.status(404).json({ error: true, message: "Travel story not found" });
        }
        
        const placeholderImgUrl = `http://localhost:8000/assets/placeholder.png`;
        
        // Delete old images that are not in the new imageUrls array
        const oldImages = travelStory.imageUrls.filter(url => !imageUrls.includes(url));
        if (oldImages.length > 0) {
            await Promise.all(oldImages.map(imageUrl => {
                const filename = path.basename(imageUrl);
                const filePath = path.join(__dirname, 'uploads', filename);
                return new Promise((resolve) => {
                    if (fs.existsSync(filePath)) {
                        fs.unlink(filePath, () => resolve());
                    } else {
                        resolve();
                    }
                });
            }));
        }
        
        travelStory.title = title;
        travelStory.story = story;      
        travelStory.visitedLocation = visitedLocation;
        travelStory.imageUrls = imageUrls.length > 0 ? imageUrls : [placeholderImgUrl];
        travelStory.visitedDate = parsedVisitedDate;
        await travelStory.save();
        res.status(200).json({ story: travelStory, message: "Travel story updated successfully" });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

//Delete Travel Story
app.delete("/delete-story/:id", authenticateToken, async(req, res) => {
    const { id } = req.params;
    const { userId } = req.user;

    try {
        //Find the travel story by ID and ensure it belongs to the authenticated user
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

        if (!travelStory) {
            return res.status(404).json({ error: true, message: "Travel story not found" });
        }

        // Delete the travel story
        await TravelStory.deleteOne({ _id: id, userId: userId });   

        // Delete all associated images
        await Promise.all(travelStory.imageUrls.map(imageUrl => {
            const filename = path.basename(imageUrl);
            const filePath = path.join(__dirname, 'uploads', filename);
            return new Promise((resolve) => {
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, () => resolve());
                } else {
                    resolve();
                }
            });
        }));

        return res.status(200).json({ error: false, message: "Travel story deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

//Update isFavourite
app.put("/update-is-favourite/:id", authenticateToken, async(req,res)=>{
    const {id} = req.params;
    const {isFavourite} = req.body;
    const {userId} = req.user;

    try{
        const travelStory = await TravelStory.findOne({_id:id, userId:userId});
        if (!travelStory){
            return res.status(404).json({error:true, message:"Travel story not found"});
        }
        travelStory.isFavourite = isFavourite;
        await travelStory.save();
        res.status(200).json({story:travelStory, message:"Travel story updated successfully"});
    }catch(error){
        res.status(500).json({error:true, message:error.message});
    }
});

//Search Travel Stories
app.get("/search", authenticateToken, async(req,res)=>{
    const {query} = req.query;
    const {userId} = req.user;

    if (!query){
        return res.status(404).json({error:true, message:"Search query is required"});
    }

    try{
        const searchResults = await TravelStory.find({
            userId:userId,
            $or:[
                {title:{$regex:query, $options:"i"}},
                {story:{$regex:query, $options:"i"}},
                {visitedLocation:{$regex:query, $options:"i"}}
            ],
        }).sort({isFavourite:-1});
        res.status(200).json({stories:searchResults});
    }catch(error){
        res.status(500).json({error:true, message:error.message});
    }
});

//Filter travel stories by date
app.get("/travel-stories/filter", authenticateToken, async(req,res)=>{
    const {startDate, endDate} = req.query;
    const {userId} = req.user;

    if (!startDate || !endDate){
        return res.status(400).json({error:true, message:"Start date and end date are required"});
    }

    try{
        // Convert startDate and endDate from string to Date object
        const start = new Date(parseInt(startDate));
        const end = new Date(parseInt(endDate));
        //Find travel stories that belong to the authenticated user and fall within the specified date range
        const filteredStories = await TravelStory.find({
            userId:userId,
            visitedDate:{$gte:start, $lte:end}
        }).sort({isFavourite:-1});

        res.status(200).json({stories:filteredStories});
    }catch(error){
        res.status(500).json({error:true, message:error.message});
    }
});



app.listen(8000,()=>{
    console.log("Server is running on port 8000");
});
module.exports = app;