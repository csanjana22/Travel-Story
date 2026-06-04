require('dotenv').config();
const config = require('./config');
const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const axios = require('axios')

const {authenticateToken} = require('./utilities');
const {geocodeLocation} = require('./geocoding');
const {single, array} = require('./multer');
const { uploadFiles, deleteByUrls } = require('./cloudinary');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PLACEHOLDER_IMAGE_URL = `${BASE_URL}/assets/placeholder.png`;
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const User = require('./models/user.model');
const TravelStory = require('./models/travelStory.model');
const Itinerary = require('./models/itinerary.model')
const PORT = process.env.PORT || 8000;

if (!config.connectionString) {
    console.error('MONGO_URI is required. Add it to backend/.env (see .env.example).');
    process.exit(1);
}

mongoose.connect(config.connectionString).catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";
const aiApi = axios.create({
    baseURL: AI_SERVICE_URL,
    timeout: 300000,
});

async function checkAiServiceHealth() {
    try {
        const res = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
        if (res.data?.ok && res.data.google_api_key_configured === true) {
            console.log(`AI service reachable at ${AI_SERVICE_URL}`);
        } else if (res.data?.ok) {
            console.warn(
                `AI_SERVICE_URL may be wrong (got backend /health, not AI service). Use http://localhost:8001 — current: ${AI_SERVICE_URL}`
            );
        }
    } catch (err) {
        console.warn(`AI service not reachable at ${AI_SERVICE_URL} — trip planner will fail until it is running. (${err.message})`);
    }
}
checkAiServiceHealth();

const app = express();
const corsOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
});

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

        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return res.status(500).json({ error: true, message: "Cloudinary is not configured" });
        }

        const files = Array.isArray(req.files) ? req.files : [req.files];
        const results = await uploadFiles(files);
        const imageUrls = results.map((result) => result.secure_url);

        res.status(200).json({ imageUrls });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

//Delete images from Cloudinary
app.delete("/delete-images", async(req, res) => {
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls)) {
        return res.status(400).json({ error: true, message: "Image URLs array is required" });
    }

    try {
        await deleteByUrls(imageUrls);
        return res.status(200).json({ message: "Images deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

// Serve static assets (placeholder) and legacy local uploads
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Add Travel Story
app.post("/add-travel-story", authenticateToken, async(req, res) => {
    let { title, story, visitedLocation, imageUrls, visitedDate, visibility } = req.body; // <-- add visibility
    const { userId } = req.user;
    
    if (!title || !story || !visitedLocation || !visitedLocation.name|| !visitedDate) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        imageUrls = [PLACEHOLDER_IMAGE_URL];
    }


    // Geocode each visitedLocation item if it has a name but no lat/lng
    if (visitedLocation.name && (!visitedLocation.lat || !visitedLocation.lng)) {
        const coords = await geocodeLocation(visitedLocation.name);
        if (coords) {
            visitedLocation.lat = coords.lat;
            visitedLocation.lng = coords.lng;
        }
    }



    //Convert visitedDate to Date object
    const parsedVisitedDate = new Date(Number(visitedDate));
   console.log(userId,title,story,visitedLocation,imageUrls,visitedDate,visibility)
    try {
        const travelStory = new TravelStory({
            userId,
            title,
            story,
            visitedLocation,
            imageUrls,
            visitedDate: parsedVisitedDate,
            visibility: visibility || 'private' 
        });

        await travelStory.save();
        res.status(201).json({ story: travelStory, error: false, message: "Added successfully" });
    } catch (error) {
         console.error("Error in /add-travel-story:", error);
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

// Get all public travel stories (no authentication required)
app.get("/public-travel-stories", async (req, res) => {
    try {
        const publicStories = await TravelStory.find({ visibility: "public" })
            .sort({ createdOn: -1 })
            .populate("userId", "fullName"); 
        res.status(200).json({ stories: publicStories, error: false, message: "Public travel stories fetched successfully" });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

//Edit Travel Story
app.put("/edit-story/:id", authenticateToken, async(req, res) => {
    const { id } = req.params;
    const { title, story, visitedLocation, visitedDate, imageUrls, visibility } = req.body; // <-- add visibility
    const { userId } = req.user;

    if (!title || !story || !visitedLocation || !visitedLocation.name || !visitedDate) {
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
        
        const oldImages = travelStory.imageUrls.filter(url => !imageUrls.includes(url));
        if (oldImages.length > 0) {
            await deleteByUrls(oldImages);
        }

        let updatedVisitedLocation = { ...visitedLocation };

        if (visitedLocation.name)  {
        const coords = await geocodeLocation(visitedLocation.name);
        if (coords) {
            updatedVisitedLocation = {
            ...visitedLocation,
            lat: coords.lat,
            lng: coords.lng,
            };
        }
        }
                
        travelStory.title = title;
        travelStory.story = story;      
        travelStory.visitedLocation = updatedVisitedLocation;
        travelStory.markModified('visitedLocation');
        travelStory.imageUrls = imageUrls.length > 0 ? imageUrls : [PLACEHOLDER_IMAGE_URL];
        travelStory.visitedDate = parsedVisitedDate;
        travelStory.visibility = visibility || travelStory.visibility; 
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
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

        if (!travelStory) {
            return res.status(404).json({ error: true, message: "Travel story not found" });
        }

        // Delete the travel story
        await TravelStory.deleteOne({ _id: id, userId: userId });   

        await deleteByUrls(travelStory.imageUrls);

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
                {"visitedLocation.name":{$regex:query, $options:"i"}}
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
        const start = new Date(parseInt(startDate));
        const end = new Date(parseInt(endDate));
        const filteredStories = await TravelStory.find({
            userId:userId,
            visitedDate:{$gte:start, $lte:end}
        }).sort({isFavourite:-1});

        res.status(200).json({stories:filteredStories});
    }catch(error){
        res.status(500).json({error:true, message:error.message});
    }
});

// Toggle favourite for public stories (per user)
app.post("/public-toggle-favourite/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: true, message: "User not found" });
        const index = user.publicFavourites?.findIndex(favId => favId.toString() === id);
        if (index >= 0) {
            // Remove from favourites
            user.publicFavourites.splice(index, 1);
        } else {
            // Add to favourites
            user.publicFavourites = user.publicFavourites || [];
            user.publicFavourites.push(id);
        }
        await user.save();
        res.status(200).json({ error: false, message: "Favourite updated" });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Request password reset
app.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: true, message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: "If this email exists, a reset link will be sent." });

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    // Check SMTP config
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP credentials missing: check SMTP_USER and SMTP_PASS in .env');
      return res.status(500).json({ error: true, message: 'Email service not configured' });
    }

    // Send email (configure your SMTP details)
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify transporter connection before sending
    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.error('Error verifying transporter:', verifyErr);
      return res.status(500).json({ error: true, message: 'Email service configuration problem' });
    }

    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;
    const mailOptions = {
      to: user.email,
      from: process.env.SMTP_USER,
      subject: 'Password Reset',
      text: `You requested a password reset. Click here: ${resetUrl}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "If this email exists, a reset link will be sent." });
  } catch (err) {
    console.error('Error in /request-password-reset:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

// Reset password
app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: true, message: "Password required" });

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) return res.status(400).json({ error: true, message: "Invalid or expired token" });

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password has been reset successfully" });
});


//Generate New Itinerary
app.post('/generate-itinerary',authenticateToken,async(req,res)=>{
    const {userId} = req.user;
    const { destination,days,budget,interests } = req.body;

    if (!destination || !days || !budget){
        return res.status(400).json({error:true , message:"Destination,days,budget are required"});
    }

    try{
        const aiResponse = await aiApi.post("/get-plan",{
            destination,days,budget,interests : interests || ""
        });
        const itineraryData = aiResponse.data
        const newItinerary = new Itinerary({
            userId,
            destination,
            days,
            budget,
            interests,
            itineraryData
        });
        await newItinerary.save()
        res.status(201).json({error:false,itinerary:newItinerary,message:"Plan generated successfully"});
    } catch (error){
        console.error("AI Service Error:", error.response?.data || error.message);
        const detail = error.response?.data?.detail;
        const message = typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
                ? detail.map((d) => d.msg || d).join(', ')
                : error.code === 'ECONNREFUSED'
                    ? `Cannot reach AI service at ${AI_SERVICE_URL}. Start it: cd ai-service && python -m uvicorn main:app --host 0.0.0.0 --port 8001`
                    : "AI Service is offline or returned an error";
        res.status(500).json({ error: true, message });
    }
});

//Revise Existing Itinerary
app.post('/revise-itinerary/:id',authenticateToken,async(req,res)=>{
    const { id } = req.params;
    const {userId} = req.user;
    const { feedback } = req.body;

    try{
        const existingItinerary = await Itinerary.findOne({_id:id , userId});
        if (!existingItinerary) return res.status(404).json({ error: true, message: "Itinerary not found" });

        const aiResponse = await aiApi.post("/revise-plan",{
            itinerary:existingItinerary.itineraryData,
            feedback,
            history: existingItinerary.feedbackHistory,
            summary:existingItinerary.summary
        });
        
        existingItinerary.itineraryData = aiResponse.data.itinerary
        existingItinerary.feedbackHistory =  aiResponse.data.new_buffer;
        existingItinerary.summary = aiResponse.data.new_summary

        await existingItinerary.save()
        res.status(200).json({error:false,itinerary:existingItinerary,message:"Plan revised successfully"});
    } catch (error){
        console.error("AI Revise Error:", error.response?.data || error.message);
        const detail = error.response?.data?.detail;
        const message = typeof detail === 'string' ? detail : error.message;
        res.status(500).json({ error: true, message });
    }
});

//Get All User Itineraries
app.get("/get-all-itineraries", authenticateToken, async(req,res)=>{
    const {userId} = req.user;

    try{
        const itineraries = await Itinerary.find({userId:userId}).sort({createdAt:-1});
        res.status(200).json({itineraries, error:false, message:"Itineraries fetched successfully"});
    } catch(error){
        res.status(500).json({error:true, message:error.message});
    }
});


//Delete Itinerary
app.delete("/delete-itinerary/:id", authenticateToken, async(req, res) => {
    const { id } = req.params;
    const { userId } = req.user;

    try {
        const deleted = await Itinerary.findOneAndDelete({ _id: id, userId: userId });

        if (!deleted) return res.status(404).json({ error: true, message: "Itinerary not found" });

        return res.status(200).json({ error: false, message: "Itinerary deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

app.get("/get-itinerary/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;

    try {
        const itinerary = await Itinerary.findOne({ _id: id, userId });
        if (!itinerary) return res.status(404).json({ error: true, message: "Itinerary not found" });
        
        res.status(200).json({ error: false, itinerary });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// app.put("/update-itinerary-info/:id", authenticateToken, async (req, res) => {
//     const { id } = req.params;
//     const { destination, interests } = req.body;
//     const { userId } = req.user;

//     try {
//         const updated = await Itinerary.findOneAndUpdate(
//             { _id: id, userId },
//             { destination, interests },
//             { new: true }
//         );
//         if (!updated) return res.status(404).json({ error: true, message: "Itinerary not found" });
        
//         res.status(200).json({ error: false, itinerary: updated, message: "Details updated" });
//     } catch (error) {
//         res.status(500).json({ error: true, message: error.message });
//     }
// });

// app.get("/get-itinerary/:id", authenticateToken, async (req, res) => {
//     const { id } = req.params;
//     const { userId } = req.user;

//     try {
//         const itinerary = await Itinerary.findOne({ _id: id, userId });
//         if (!itinerary) return res.status(404).json({ error: true, message: "Itinerary not found" });
        
//         res.status(200).json({ error: false, itinerary });
//     } catch (error) {
//         res.status(500).json({ error: true, message: error.message });
//     }
// });

// app.post("/clear-itinerary-history/:id", authenticateToken, async (req, res) => {
//     const { id } = req.params;
//     const { userId } = req.user;

//     try {
//         const itinerary = await Itinerary.findOneAndUpdate(
//             { _id: id, userId },
//             { feedbackHistory: [] },
//             { new: true }
//         );
//         res.status(200).json({ error: false, message: "History cleared", itinerary });
//     } catch (error) {
//         res.status(500).json({ error: true, message: error.message });
//     }
// });


// Search Transportations
// Query params: origin (required), destination (required), date (optional, YYYY-MM-DD), mode (optional: flight/train/bus/car/ferry)
app.get('/search-transportations', async (req, res) => {
    const { origin, destination, date, mode } = req.query;

    if (!origin || !destination) return res.status(400).json({ error: true, message: 'Origin and destination are required' });

    try {
        // If an external transport API is configured via env vars, proxy the request
        if (process.env.TRANSPORT_API_URL) {
            const params = { origin, destination };
            if (date) params.date = date;
            if (mode) params.mode = mode;

            const headers = {};
            if (process.env.TRANSPORT_API_KEY) headers['Authorization'] = `Bearer ${process.env.TRANSPORT_API_KEY}`;

            const resp = await axios.get(process.env.TRANSPORT_API_URL, { params, headers, timeout: 15000 });
            const raw = resp.data || {};

            // Normalize to { id, provider, price, duration, departure, arrival, mode }
            const results = (raw.results || raw.data || []).map((r, i) => ({
                id: r.id || `${Date.now()}-${i}`,
                provider: r.provider || r.name || r.carrier || 'Provider',
                price: r.price || r.cost || null,
                duration: r.duration || r.travel_time || '',
                departure: r.departure || r.departure_time || null,
                arrival: r.arrival || r.arrival_time || null,
                mode: r.mode || mode || ''
            }));

            return res.status(200).json({ error: false, results });
        }

        // No external API configured — return a small set of mocked results
        const mock = [
            { id: 'mock1', provider: 'FastAir', price: 4500, duration: '2h 15m', departure: '09:00', arrival: '11:15', mode: 'flight' },
            { id: 'mock2', provider: 'NightBus', price: 900, duration: '10h', departure: '22:00', arrival: '08:00', mode: 'bus' }
        ];

        return res.status(200).json({ error: false, results: mock });

    } catch (err) {
        console.error('Transport search error:', err.message || err);
        return res.status(500).json({ error: true, message: 'Failed to search transportations' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
module.exports = app;