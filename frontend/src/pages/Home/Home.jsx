import React,{useState,useEffect} from 'react';
import {data, useNavigate} from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import {MdAdd} from "react-icons/md";
import Modal from "react-modal";
Modal.setAppElement('#root');

import TravelStoryCard from '../../components/cards/TravelStoryCard';
import AddEditTravelStory from './AddEditTravelStory'
import ViewTravelStory from './ViewTravelStory'
import EmptyCard from '../../components/cards/EmptyCard';
import FilterInfoTitle from '../../components/cards/FilterInfoTitle';
import SearchBar from '../../components/Input/SearchBar';

import {ToastContainer,toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';

import EmptyImg from '../../assets/images/add-story.png';
import { DayPicker } from 'react-day-picker';

const Home = () => {
  const navigate=useNavigate();

  const [userInfo, setUserInfo] = useState(null);
  const[allStories,setAllStories]=useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const[filterType,setFilterType]=useState('');
  const[dateRange,setDateRange]=useState({form:null ,to:null})

  const[openAddEditModal, setOpenAddEditModal]=useState({
    isShown:false,
    type:"add",
    data:null,
  });
  const [openViewModal,setOpenViewModal]=useState({
    isShown:false,
    data:null,
  });

  const handleShowPublicStories = () => {
    navigate('/');
  };

  //Get userInfo
  const getUserInfo = async()=>{
    try{
      const response =await axiosInstance.get('/get-user');
      if (response.data && response.data.user){
        setUserInfo(response.data.user);
      }
    }catch(error){
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  //Get all travel stories
  const getAllTravelStories = async () => {
    try{
        const response =await axiosInstance.get('/get-all-travel-stories');
      if (response.data && response.data.stories){
        setAllStories(response.data.stories);
    }
  }catch(error){
    console.log("An error occurred while fetching stories:", error);
    }
  };

  //handle edit Story
  const handleEdit=(data)=>{
    setOpenAddEditModal({isShown:true,type:"edit",data:data});
  };

  //handle viewstory
  const handleViewStory=(data)=>{
    setOpenViewModal({isShown:true,data})
  };

  //handle update favourite
  const updateIsFavourite = async (storyData) => {
    // Optimistically update UI
    setAllStories(prev =>
      prev.map(story =>
        story._id === storyData._id
          ? { ...story, isFavourite: !story.isFavourite }
          : story
      )
    );
    try {
      await axiosInstance.put("/update-is-favourite/" + storyData._id, {
        isFavourite: !storyData.isFavourite,
      });
      toast.success("Story Updated Successfully");
      if (filterType==="search" && searchQuery){
        onSearchStory(searchQuery);
      } else if (filterType==="date"){
        filterStoriesByDate(dateRange);
      }else{
      getAllTravelStories();
      }
    } catch (error) {
      toast.error("Failed to update favourite");
      setAllStories(prev =>
        prev.map(story =>
          story._id === storyData._id
            ? { ...story, isFavourite: story.isFavourite }
            : story
        )
      );
    }
  };

  //Delete story
  const deleteTravelStory = async (data)=>{
    const storyId = data._id

    try{
      const response = await axiosInstance.delete("/delete-story/"+storyId);

      if (response.data && !response.data.error){
        toast.error("Story Deleted Successfully");
        setOpenViewModal((prevState)=>({...prevState,isShown:false}));
        getAllTravelStories()
      }
    }catch(error){
      console.log("An unexpected error occured.Please try again")     
    }
  };

  //Search Story
  const onSearchStory =async(query)=>{
    try{
      const response = await axiosInstance.get("/search",{
        params:{
          query,
        },
      });

      if (response.data && response.data.stories){
        setFilterType("search");
        setAllStories(response.data.stories)
      }
    }catch(error){
      console.log("An unexpected error occured.Please try again")     
    }
  };

  const handleClearSearch =async()=>{
    setFilterType("")
    getAllTravelStories();
  };

  //Handle filter stories by Date
  const filterStoriesByDate =async(day)=>{
    try{
      const startDate = day.from ? moment(day.from).valueOf() : null;
      const endDate = day.to ? moment(day.to).valueOf() : null;

      if (startDate && endDate) {
          const response = await axiosInstance.get("/travel-stories/filter", {
              params: { startDate, endDate },
          });

          if (response.data && response.data.stories) {
              setFilterType("date");
              setAllStories(response.data.stories);
          }
      }
    }catch(error){
      console.log("An unexpected error occured.Please try again")
    }
  }

  //Handle Date Range SElect
  const handleDayClick=(day)=>{
    setDateRange(day);
    filterStoriesByDate(day);
  }

  const resetFilter = () => {
    setDateRange({ from: null, to: null });
    setFilterType("");
    getAllTravelStories();
};
  

  // Search effect 
  useEffect(() => {
    if (!searchQuery) {
      getAllTravelStories();
      return;
    }
    setFilterType('search');
    onSearchStory(searchQuery);
  }, [searchQuery]);

  // Manual search handler 
  const handleManualSearch = () => {
    if (!searchQuery) {
      getAllTravelStories();
      setFilterType("");
      return;
    }
    setFilterType('search');
    onSearchStory(searchQuery);
  };

  // Manual clear handler 
  const handleManualClear = () => {
    setSearchQuery("");
    setFilterType("");
    getAllTravelStories();
  };

  useEffect(() => {
    getUserInfo();
    getAllTravelStories();
    if (!searchQuery) {
      getAllTravelStories();
      return;
    }
    onSearchStory(searchQuery);
    return () => {
    }
  },[searchQuery]);

  return (
    <>
    <div className="flex justify-center mt-6 mb-2">
      <SearchBar
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        handleSearch={handleManualSearch}
        onClearSearch={handleManualClear}
      />
    </div>
    <div className='container mx-auto py-10'>

      <FilterInfoTitle 
       filterType={filterType}
       filterDates={dateRange}
       onClear={handleManualClear}
       />

      <div className ='flex gap-7'>
        <div className='flex-1'>
          {allStories.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {allStories.map((item)=>{
                return(
                  <TravelStoryCard
                  key={item._id}
                  imageUrls={item.imageUrls}
                  title={item.title}
                  story={item.story}
                  date={item.visitedDate}
                  visitedLocation={item.visitedLocation}
                  isFavourite={item.isFavourite}
                  onClick={()=>handleViewStory(item)}
                  onFavouriteClick={()=>updateIsFavourite(item)}
                  />
                );
              })}
              </div>
          ) : filterType === "search" ? (
            <EmptyCard
              imgSrc={EmptyImg}
              message="No results found for your search."
            />
          ) : (
            <EmptyCard
              imgSrc={EmptyImg}
              message="Start creating your first Story! Click the 'Add' button to 
              jot down your thoughts,ideas and memories.Let's get started"
            />
          )}
</div>
        <div className='w-[350px]'>
          <div className='bg-white border border-slate-200 shadow-lg shadow-slate-200/60 rounded-lg'>
          <div className='p-3'>
            <DayPicker
             captionLayout='dropdown-buttons'
             mode="range"
             selected={dateRange}
             onSelect={handleDayClick}
             pagedNavigation
            />
          </div>
          </div>
        </div>
      </div>
    </div>

    {/*Add & Edit Travel Story Modal*/}
    <Modal 
    isOpen={openAddEditModal.isShown}
    onRequestClose={()=>{}}
    style={{overlay:{backgroundColor:"rgba(0,0,0,0.2)",zIndex:999,},}}
    className="model-box"
    >
      <AddEditTravelStory
      storyInfo={openAddEditModal.data}
      type={openAddEditModal.type}
      onClose={()=>{
      setOpenAddEditModal({isShown:false, type:"add", data:null});
    }}
      getAllTravelStories={getAllTravelStories}
    />
    </Modal>

    {/*View Travel Story Model*/}
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
     onEditClick={()=>{
      setOpenViewModal((prevState)=>({...prevState, isShown:false}));
      handleEdit(openViewModal.data || null)
     }}
     onDeleteClick={()=>{
      deleteTravelStory(openViewModal.data || null);
     }}
     />
    </Modal> 

    <button
      className='w-16 h-16 flex items-center justify-center rounded-full bg-primary hover:bg-cyan-400 fixed right-10 bottom-10 '
      onClick={()=>{
        setOpenAddEditModal({isShown:true, type:"add", data:null});
      }}
    >
      <MdAdd className='text-[32px] text-white'/>
    </button>

    <ToastContainer/>
    </>
  )
}

export default Home
