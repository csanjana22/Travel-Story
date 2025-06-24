import React, { useState, useEffect } from 'react';
import moment from 'moment/moment';
import {FaHeart} from 'react-icons/fa';
import {GrMapLocation} from 'react-icons/gr';

const TravelStoryCard = ({
    imageUrls,
    title,
    story,
    date,
    visitedLocation=[],
    isFavourite,
    onClick,
    onFavouriteClick,
    username
  }) => {

  const defaultImage = "http://localhost:8000/assets/placeholder.png";
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let interval;
    if (isHovering && imageUrls && imageUrls.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isHovering, imageUrls]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentImage = imageUrls?.[currentImageIndex] || defaultImage;

  return (
      <div 
        className={`border rounded-lg overflow-hidden bg-white hover:shadow-slate-200 transition-all ease-in-out relative cursor-pointer 
          transform-gpu transition-transform duration-500 
          ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} 
          hover:scale-105`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setCurrentImageIndex(0);
        }}
      >
        <div className='relative'>
          <img 
            src={currentImage}
            alt={title}
            className='w-full h-56 object-cover rounded-lg transition-opacity duration-300'
            onClick={onClick}
          />
          {imageUrls && imageUrls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 px-1.5 py-0.5  rounded-full">
              {[...Array(Math.min(3, imageUrls.length))].map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentImageIndex === index ? 'bg-white scale-110' : 'bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <button 
        className='w-12 h-12 flex items-center justify-center bg-white/40 rounded-lg border border-white/30 absolute top-4 right-4'
        onClick={onFavouriteClick}
        >
        <FaHeart className={`icon-btn ${isFavourite ? "text-red-500" : "text-white"}`}/>
        </button>


        <div className='p-4' onClick={onClick}>
          <div className='flex items-center gap-3'>
            <div className='flex-1'>
              <h6 className='text-sm font-medium'>{title}</h6>
              {username && (
                <span className="block text-xs text-slate-500 mb-1">by {username}</span>
              )}
              <span className='text-xs text-gray-500'>
                {date ? moment(date).format("DD MMM YYYY"):"-"}
              </span>
            </div>
          </div>

          <p className='text-xs text-slate-600 mt-2'>{story?.slice(0,60)}</p>

          <div className='inline-flex items-center gap-2 text-[13px] text-cyan-600 bg-cyan-200/40 rounded mt-3 px-2 py-1'>
            <GrMapLocation className='text-sm'/>
            {visitedLocation.map((item,index)=>visitedLocation.length==index+ 1 ? `${item}`:`${item},`
          )}
          </div>
        </div>
      </div>
  )
}

export default TravelStoryCard
