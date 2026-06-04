import React, { useState, useEffect } from 'react';
import moment from 'moment/moment';
import {FaHeart} from 'react-icons/fa';
import {GrMapLocation} from 'react-icons/gr';
import { DEFAULT_IMAGE_URL } from '../../utils/constants';

const TravelStoryCard = ({
    imageUrls,
    title,
    story,
    date,
    visitedLocation={},
    isFavourite,
    onClick,
    onFavouriteClick,
    username
  }) => {

  const defaultImage = DEFAULT_IMAGE_URL;
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
        className='w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/60 backdrop-blur-md rounded-lg border border-white/30 absolute top-3 right-3 z-10'
        // className='w-12 h-12 flex items-center justify-center bg-white/40 rounded-lg border border-white/30 absolute top-4 right-4'
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
            {visitedLocation?.name || 'Location not specified'}
          </div>
        </div>
      </div>
  )
}

export default TravelStoryCard

// import React, { useState, useEffect } from 'react';
// import moment from 'moment/moment';
// import { FaHeart } from 'react-icons/fa';
// import { GrMapLocation } from 'react-icons/gr';

// const TravelStoryCard = ({
//   imageUrls,
//   title,
//   story,
//   date,
//   visitedLocation = {},
//   isFavourite,
//   onClick,
//   onFavouriteClick,
//   username
// }) => {
//   const defaultImage = "http://localhost:8000/assets/placeholder.png";
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [isHovering, setIsHovering] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     let interval;
//     // Added touch support: the carousel runs if hovering OR if a mobile user 
//     // has tapped/focused on the card.
//     if (isHovering && imageUrls && imageUrls.length > 1) {
//       interval = setInterval(() => {
//         setCurrentImageIndex((prevIndex) =>
//           prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
//         );
//       }, 1000);
//     }
//     return () => clearInterval(interval);
//   }, [isHovering, imageUrls]);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   const currentImage = imageUrls?.[currentImageIndex] || defaultImage;

//   return (
//     <div
//       className={`border rounded-lg overflow-hidden bg-white hover:shadow-lg transition-all ease-in-out relative cursor-pointer 
//           flex flex-col h-full w-full
//           transform-gpu transition-transform duration-500 
//           ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} 
//           hover:scale-[1.02] active:scale-95`} // Added active:scale for mobile feedback
//       onMouseEnter={() => setIsHovering(true)}
//       onMouseLeave={() => {
//         setIsHovering(false);
//         setCurrentImageIndex(0);
//       }}
//       // Touch support for mobile devices
//       onTouchStart={() => setIsHovering(true)}
//       onTouchEnd={() => {
//         setTimeout(() => setIsHovering(false), 2000); // Stop cycling after 2s on mobile
//       }}
//     >
//       <div className='relative w-full aspect-[4/3] sm:aspect-video md:h-52 overflow-hidden'>
//         <img
//           src={currentImage}
//           alt={title}
//           className='w-full h-full object-cover rounded-t-lg transition-opacity duration-300'
//           onClick={onClick}
//         />
        
//         {/* Responsive Image Pagination Indicators */}
//         {imageUrls && imageUrls.length > 1 && (
//           <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-full">
//             {imageUrls.slice(0, 5).map((_, index) => ( // Limiting to 5 dots to prevent overflow
//               <div
//                 key={index}
//                 className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
//                   currentImageIndex === index ? 'bg-white scale-125' : 'bg-white/50'
//                 }`}
//               />
//             ))}
//           </div>
//         )}
//       </div>

//       <button
//         className='w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/60 backdrop-blur-md rounded-lg border border-white/30 absolute top-3 right-3 z-10'
//         onClick={(e) => {
//           e.stopPropagation(); // Prevent clicking heart from opening the story
//           onFavouriteClick();
//         }}
//       >
//         <FaHeart className={`text-lg transition-colors ${isFavourite ? "text-red-500" : "text-white drop-shadow-md"}`} />
//       </button>

//       <div className='p-4 flex flex-col flex-grow' onClick={onClick}>
//         <div className='flex items-start justify-between gap-2'>
//           <div className='flex-1'>
//             {/* Clamped title for mobile */}
//             <h6 className='text-sm md:text-base font-medium line-clamp-1'>{title}</h6>
//             {username && (
//               <span className="block text-[11px] md:text-xs text-slate-500">by {username}</span>
//             )}
//             <span className='text-[11px] md:text-xs text-gray-400'>
//               {date ? moment(date).format("DD MMM YYYY") : "-"}
//             </span>
//           </div>
//         </div>

//         {/* Flexible text clamping: show 2 lines on all screens */}
//         <p className='text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed'>
//           {story}
//         </p>

//         {/* Spacer to push location to bottom */}
//         <div className="flex-grow" />

//         <div className='inline-flex items-center self-start gap-2 text-[11px] md:text-[13px] text-cyan-700 bg-cyan-50 rounded mt-3 px-2 py-1 border border-cyan-100'>
//           <GrMapLocation className='text-xs md:text-sm' />
//           <span className="truncate max-w-[150px] md:max-w-full">
//             {visitedLocation?.name || 'Location not specified'}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default TravelStoryCard;