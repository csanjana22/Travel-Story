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

const DEFAULT_IMAGE_URL = "http://localhost:8000/assets/placeholder.png";

const AddEditTravelStory = ({
    storyInfo,
    type,
    onClose,
    getAllTravelStories,
}) => {
    const [title, setTitle] = useState(storyInfo?.title || "");
    const [storyImages, setStoryImages] = useState(storyInfo?.imageUrls || []);
    const [story, setStory] = useState(storyInfo?.story || "");
    const [visitedLocation, setVisitedLocation] = useState(storyInfo?.visitedLocation || []);
    const [visitedDate, setVisitedDate] = useState(storyInfo?.visitedDate || null)
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

            const response = await axiosInstance.post("/add-travel-story", {
                title,
                story,
                imageUrls,
                visitedLocation,
                visitedDate: visitedDate ?
                    moment(visitedDate).valueOf()
                    : moment().valueOf(),
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
        if (!visitedLocation || visitedLocation.length === 0) {
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
        <div className='relative'>
            <div className='flex items-center justify-between'>
                <h5 className='test-xl font-medium text-slate-700'>
                    {type === "add" ? "Add Story" : "Update Story"}
                </h5>

                <div>
                    <div className='flex items-center gap-3 bg-cyan-50/50 p-2 rounded-l-lg'>
                        {type === 'add' ? (
                            <button className='btn-small' onClick={handleAddOrUpdateClick}>
                                <MdAdd className="text-lg" />ADD STORY
                            </button>
                        ) : (
                            <button className='btn-small' onClick={handleAddOrUpdateClick}>
                                <MdUpdate className="text-lg" />UPDATE STORY
                            </button>
                        )}

                        <button className='' onClick={onClose}>
                            <MdClose className='text-xl text-slate-400' />
                        </button>
                    </div>

                    {error && (<p className='text-red-500 text-xs pt-2 text-right'>{error}</p>)}
                </div>
            </div>

            <div>
                <div className='flex-1 flex flex-col gap-2 pt-4'>
                    <label className='input-label'>TITLE</label>
                    <input
                        type="text"
                        className='text-2xl text-slate-950 outline-none'
                        placeholder="A Day at the Great Wall"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <div className='my-3'>
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
                        <label className='input-label'>VISITED LOCATIONS</label>
                        <TagInput tags={visitedLocation} setTags={setVisitedLocation} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddEditTravelStory
