import React, { useState } from 'react'
import { MdAdd, MdDeleteOutline, MdUpdate, MdClose } from "react-icons/md"
import DateSelector from '../../components/Input/DateSelector'
import ImageSelector from '../../components/Input/ImageSelector'
import TagInput from '../../components/Input/TagInput'
import axiosInstance from '../../utils/axiosInstance'
import moment from 'moment/moment'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import uploadImage from '../../utils/uploadImage'
import { DEFAULT_IMAGE_URL } from '../../utils/constants'

const AddEditTravelStory = ({
    storyInfo,
    type,
    onClose,
    getAllTravelStories,
}) => {
    const [title, setTitle] = useState(storyInfo?.title || "");
    const [storyImages, setStoryImages] = useState(storyInfo?.imageUrls || []);
    const [story, setStory] = useState(storyInfo?.story || "");
    const [visitedLocation, setVisitedLocation] = useState(storyInfo?.visitedLocation || {name:""});
    const [visitedDate, setVisitedDate] = useState(
        storyInfo?.visitedDate ? new Date(storyInfo.visitedDate) : null
        );
    const [visibility, setVisibility] = useState(storyInfo?.visibility || "private"); 
    const [error, setError] = useState("")

    const addNewTravelStory = async () => {
        try {
            let imageUrls = [];
            
            // Upload all new images
            const uploadPromises = storyImages
                .filter(img => img instanceof File)
                .map(img => uploadImage(img));
            
            const uploadResults = await Promise.all(uploadPromises);
            imageUrls = uploadResults.map(res => res.imageUrl).filter(url => url);

            // If no images were uploaded, use default
            if (imageUrls.length === 0) {
                imageUrls = [DEFAULT_IMAGE_URL];
            }
            console.log(title,story,imageUrls,visitedLocation,visitedDate,visibility)
            const response = await axiosInstance.post("/add-travel-story", {
                title,
                story,
                imageUrls,
                visitedLocation,
                visitedDate: visitedDate ?
                    moment(visitedDate).valueOf()
                    : moment().valueOf(),
                visibility,
            });

            if (response.data && response.data.story) {
                toast.success("Story Added Successfully");
                getAllTravelStories();
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to add story.");
        }
    };

    const updateTravelStory = async () => {
        const storyId = storyInfo._id;
        try {
            let imageUrls = storyImages.filter(img => typeof img === 'string');

            // Upload new images
            const uploadPromises = storyImages
                .filter(img => img instanceof File)
                .map(img => uploadImage(img));
            
            const uploadResults = await Promise.all(uploadPromises);
            const newImageUrls = uploadResults.map(res => res.imageUrl).filter(url => url);
            imageUrls = [...imageUrls, ...newImageUrls];

            // If no images, use default
            if (imageUrls.length === 0) {
                imageUrls = [DEFAULT_IMAGE_URL];
            }

            const postData = {
                title,
                story,
                imageUrls,
                visitedLocation,
                visitedDate: visitedDate
                    ? moment(visitedDate).valueOf()
                    : moment().valueOf(),
                visibility 
            };

            const response = await axiosInstance.put(
                "/edit-story/" + storyId,
                postData
            );

            if (response.data && response.data.story) {
                toast.success("Story Updated Successfully");
                getAllTravelStories();
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update story.");
        }
    };

    const handleAddOrUpdateClick = () => {
        if (!title) {
            setError("Please Enter the title")
            return;
        }
        if (!story) {
            setError("Please Enter the story")
            return;
        }
        if (!visitedLocation || !visitedLocation.name) {
            setError("Please Enter the location")
            return;
        }

        setError("");

        if (type === "edit") {
            updateTravelStory();
        } else {
            addNewTravelStory();
        }
    };

    const handleDeleteImages = async (index) => {
        if (type === "edit" && storyInfo) {
            const imageToDelete = storyImages[index];
            if (typeof imageToDelete === 'string') {
                try {
                    await axiosInstance.delete("/delete-images", {
                        data: { imageUrls: [imageToDelete] }
                    });
                } catch (error) {
                    console.error("Error deleting image:", error);
                }
            }
        }
    };

    return (
        <div className='relative px-4 py-2 md:px-0'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                <h5 className='text-xl font-medium text-slate-700'>
                    {type === "add" ? "Add Story" : "Update Story"}
                </h5>

                <div className='w-full sm:w-auto flex flex-col items-end gap-1'>
                    <div className='flex items-center gap-3 bg-cyan-50/50 p-2 rounded-lg sm:rounded-l-lg sm:rounded-r-none w-full sm:w-auto justify-between sm:justify-start'>
                        {type === 'add' ? (
                            <button className='btn-small flex items-center gap-1' onClick={handleAddOrUpdateClick}>
                                <MdAdd className="text-lg" />ADD STORY
                            </button>
                        ) : (
                            <button className='btn-small flex items-center gap-1' onClick={handleAddOrUpdateClick}>
                                <MdUpdate className="text-lg" />UPDATE STORY
                            </button>
                        )}

                        <button className='p-1 hover:bg-slate-100 rounded-full transition-all' onClick={onClose}>
                            <MdClose className='text-xl text-slate-400' />
                        </button>
                    </div>

                    {error && (<p className='text-red-500 text-xs pt-2 text-right'>{error}</p>)}
                </div>
            </div>

            <div className='mt-6 space-y-6'>
                <div className='flex flex-col gap-2'>
                    <label className='input-label'>TITLE</label>
                    <input
                        type="text"
                        className='text-xl md:text-2xl text-slate-950 outline-none border-b border-transparent focus:border-cyan-100 transition-all'
                        placeholder="A Day at the Great Wall"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                {/* Date & Visibility: Side-by-side on tablet/desktop */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-start'>
                    <div className='space-y-2'>
                        <label className='input-label'>DATE</label>
                        <DateSelector date={visitedDate} setDate={setVisitedDate} />
                    </div>

                    <div className='space-y-2'>
                        <label className='input-label mr-2px'>VISIBILITY</label> <br></br>
                        <select
                            className='w-full md:w-auto p-1 rounded border border-slate-300 text-sm bg-white text-slate-600 focus:ring-1 focus:ring-cyan-200 outline-none'
                            value={visibility}
                            onChange={e => setVisibility(e.target.value)}
                        >
                            <option value="public">Public </option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                </div>

                {/* Image Selection Section */}
                <div className='space-y-2'>
                    <label className='input-label'>STORY IMAGES</label>
                    <ImageSelector 
                        images={storyImages} 
                        setImages={setStoryImages} 
                        handleDeleteImages={handleDeleteImages}
                    />
                </div>

                {/* Story Textarea: Flexible Height */}
                <div className='flex flex-col gap-2'>
                    <label className='input-label'>YOUR STORY</label>
                    <textarea
                        className='text-sm text-slate-950 outline-none bg-slate-50 p-3 rounded border border-slate-100 focus:bg-white focus:border-cyan-100 transition-all resize-none md:resize-y'
                        placeholder='Describe your journey...'
                        rows={window.innerWidth < 768 ? 6 : 10}
                        value={story}
                        onChange={(e) => setStory(e.target.value)}
                    />
                </div>

                {/* Location Input */}
                <div className='pb-6'>
                    <label className='input-label'>VISITED LOCATION</label>
                    <TagInput location={visitedLocation} setLocation={setVisitedLocation} />
                </div>
            </div>
                    {/* <div className='my-3'>
                        <DateSelector date={visitedDate} setDate={setVisitedDate} />
                    </div>

                    <ImageSelector 
                        images={storyImages} 
                        setImages={setStoryImages} 
                        handleDeleteImages={handleDeleteImages}
                    />

                    <div className='flex flex-col gap-2 mt-4'>
                        <label className='input-label'></label>
                        <textarea
                            type='text'
                            className='text-sm text-slate-950 outline-none bg-slate-50 p-2 rounded'
                            placeholder='Your Story'
                            rows={10}
                            value={story}
                            onChange={(e) => setStory(e.target.value)}
                        />
                    </div>

                    <div className='pt-3'>
                        <label className='input-label'>VISITED LOCATION</label>
                        <TagInput location={visitedLocation} setLocation={setVisitedLocation} />
                    </div>
                
                    <div className='pt-3'>
                        <label className='input-label'>VISIBILITY</label><br/>
                        <select
                            className='p-1 rounded border border-slate-300 text-sm mt-3 text-slate-550'
                            value={visibility}
                            onChange={e => setVisibility(e.target.value)}
                        >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                </div> */}
            </div>

    )
}

export default AddEditTravelStory
