import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import TravelStoryCard from "../components/cards/TravelStoryCard";
import ViewTravelStory from "./Home/ViewTravelStory";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import aImage from '../assets/images/a.webp';
import Modal from "react-modal";
import { FaMagnifyingGlass } from "react-icons/fa6";

const LandingPage = ({ userInfo }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openViewModal, setOpenViewModal] = useState({
  isShown: false,
  data: null,
  });
  const navigate = useNavigate();

  // Add a ref for the public stories section
  const storiesRef = React.useRef(null);
  const location = useLocation();

  const fetchPublicStories = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/public-travel-stories");
      let stories = res.data.stories || [];
      if (userInfo && userInfo.publicFavourites) {
        stories = stories.map(story => ({
          ...story,
          isFavourite: userInfo.publicFavourites.includes(story._id)
        }));
      } else {
        stories = stories.map(story => ({
          ...story,
          isFavourite: false
        }));
      }
      setStories(stories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicStories();
  }, []);


  // Search handler for public stories
  useEffect(() => {
    if (!searchQuery) {
      fetchPublicStories();
      return;
    }
    setLoading(true);
    axios.get("http://localhost:8000/public-travel-stories")
      .then(res => {
        let allStories = res.data.stories || [];
        const filtered = allStories.filter(
          (story) =>
            story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            story.story.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (story.visitedLocation &&
              story.visitedLocation.join(", ").toLowerCase().includes(searchQuery.toLowerCase()))
        );
        // Explicitly set isFavourite false if not logged in
        if (!(userInfo && userInfo.publicFavourites)) {
          setStories(filtered.map(story => ({ ...story, isFavourite: false })));
        } else {
          setStories(filtered.map(story => ({
            ...story,
            isFavourite: userInfo.publicFavourites.includes(story._id)
          })));
        }
      })
      .finally(() => setLoading(false));
  }, [searchQuery]);

    
     useEffect(() => {
      if (location.state?.scrollTo === "stories") {
        setTimeout(() => {
          storiesRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100); // Delay to ensure content is ready
      }
    }, [location]);
    
  // Handler for Add button
  const handleAddClick = () => {
    const isToken = localStorage.getItem('token');
    if (!isToken) {
      toast.info("Login to add stories");
      setTimeout(() => navigate('/login'), 1200);
    } else {
      navigate('/dashboard');
    }
  };

  // Add favourite handler
  const handleFavouriteClick = async (story) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info("Login to favourite stories");
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    try {
      await axios.post(
        `http://localhost:8000/public-toggle-favourite/${story._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStories(prev =>
        prev.map(s =>
          s._id === story._id ? { ...s, isFavourite: !s.isFavourite } : s
        )
      );
    } catch (err) {
      toast.error("Failed to update favourite");
    }
  };

  // Scroll to stories when searching
  const handleHeroSearch = () => {
    if (storiesRef.current) {
      storiesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  

  return (
    <div>
        {/* Hero Section with Background Image and Headline */}
      <div className="relative h-[95vh] w-screen flex items-center justify-center m">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${aImage})`,
            filter: 'brightness(0.7)'
          }}
        ></div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full">
          <h1 className="text-white text-6xl font-extrabold text-center drop-shadow-lg pb-10">
          A Storybook for the Roads You Roam!
          </h1>
          {/* Custom Search Bar */}
          <div className="flex items-center w-full max-w-2xl bg-white rounded-full shadow-lg pl-8 py-1">
            <input
              type="text"
              placeholder="Search for stories..."
              className="flex-1 bg-transparent outline-none text-lg text-gray-700"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleHeroSearch(); }}
            />
            <button
              className="ml-4 text-primary text-bold text-2xl bg-primary/10 rounded-full p-3.5 hover:bg-primary/20 transition"
              onClick={handleHeroSearch}
            >
              <FaMagnifyingGlass />
            </button>
          </div>
        </div>
      </div>
      {/* Public Stories Section */}
      <div ref={storiesRef} />

        <h1 className="text-2xl font-bold my-6 text-center">Public Travel Stories</h1>
        {stories.length === 0 && <p className="text-center">No public stories yet.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-6 mx-[100px] mb-10">
          {stories.map(story => (
            <TravelStoryCard
              key={story._id}
              imageUrls={story.imageUrls}
              title={story.title}
              story={story.story}
              date={story.visitedDate}
              visitedLocation={story.visitedLocation}
              isFavourite={story.isFavourite}
              onClick={() => setOpenViewModal({ isShown: true, data: story })}
              onFavouriteClick={() => handleFavouriteClick(story)}
              username={story.userId?.fullName}
            />
          ))}
        </div>
      {/* Add Story Floating Button */}
      <button
        className='w-16 h-16 flex items-center justify-center rounded-full bg-primary hover:bg-cyan-400 fixed right-10 bottom-10'
        onClick={handleAddClick}
        title="Add Story"
      >
        <span className="text-3xl text-white">+</span>
      </button>
      <ToastContainer />
      <Modal 
        isOpen={openViewModal.isShown}
        onRequestClose={()=>{}}
        style={{overlay:{backgroundColor:"rgba(0,0,0,0.2)",zIndex:999,},}}
        className="model-box"
        >
        <ViewTravelStory
        storyInfo={openViewModal.data || null}
        onClose={()=>{
          setOpenViewModal((prevState)=>({...prevState, isShown:false}))}}
        />
        </Modal> 
      {/* Footer */}
      <footer className="w-full bg-gray-100 text-center py-6 mt-10 border-t border-gray-200">
        <p className="text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} Travel Story App. Made with <span className="text-red-400">♥</span> by Sanjana.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;