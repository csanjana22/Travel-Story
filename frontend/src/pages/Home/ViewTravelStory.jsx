import React from 'react'
import {MdAdd, MdDeleteOutline,MdUpdate,MdClose} from 'react-icons/md'
import moment from 'moment/moment'
import {GrMapLocation} from 'react-icons/gr';

function ViewTravelStory({storyInfo,onClose,onEditClick,onDeleteClick}) {
    
  const isLandingPage = !onEditClick && !onDeleteClick;

  return (
    <div className='relative px-2 py-2 md:px-0'>
        {isLandingPage && (
        <button className='absolute top-2 right-2 p-2 hover:bg-slate-100 rounded-full z-10' onClick={onClose}>
          <span className='text-2xl text-slate-400'>&times;</span>
        </button>
        )}
        {!isLandingPage && (
        <div className='flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3 mb-4'>
            <div className='flex items-center gap-2 md:gap-3 bg-cyan-50/50 p-1.5 md:p-2 rounded-lg md:rounded-l-lg'>
                    <button className='btn-small flex items-center gap-1' onClick={onEditClick}>
                      <MdUpdate className="text-base md:text-lg"/>
                      <span className="xs:inline">UPDATE STORY</span>
                    </button>
                    <button className='btn-small btn-delete flex items-center gap-1' onClick={onDeleteClick}>
                      <MdDeleteOutline className="text-base md:text-lg"/>
                      <span className="xs:inline">DELETE</span>
                    </button>             
                    <button className='p-1 hover:bg-slate-200 rounded-full' onClick={onClose}>
                      <MdClose className='text-xl text-slate-400'/>
                    </button>
                </div>
            </div>
        )}
        <div mt-4>
            <div className="flex-1 flex flex-col gap-2 py-2 md:py-4">
                <h1 className="text-xl md:text-2xl font-semibold text-slate-950 leading-tight">
                    {storyInfo && storyInfo.title}
                </h1>
                {/* Username below title, only if present */}
                {storyInfo?.userId?.fullName && (
                <span className="block text-xs md:text-sm text-slate-500 ">by {storyInfo.userId.fullName}</span>
                )}                  
                <div className="flex flex-wrap items-center justify-between gap-y-3 mt-2">
                    <span className="text-[11px] md:text-xs text-slate-500 font-medium">
                        {storyInfo && moment(storyInfo.visitedDate).format("Do MMM YYYY")}
                    </span>

                    {/* Place visibility badge above visited location */}
                    <div className="flex items-center gap-2">
                    {!isLandingPage && storyInfo?.visibility && (
                        <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] md:text-xs font-semibold capitalize border 
                            ${storyInfo.visibility === 'public'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-100 text-gray-600 border-gray-300'
                            }`}
                        > {storyInfo.visibility}
                        </span>
                        )}

                        <div className="inline-flex items-center gap-1.5 text-[11px] md:text-[13px] text-cyan-600 bg-cyan-200/40 rounded px-2 py-1">
                            <GrMapLocation className="text-xs md:text-sm" />
                            <span className="truncate max-w-[150px] md:max-w-none">
                                {storyInfo?.visitedLocation?.name || 'Location not specified'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>        
                        
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-4'>
                {storyInfo?.imageUrls?.map((imageUrl, index) => (
                    <img 
                        key={index}
                        src={imageUrl} 
                        alt={`Story image ${index + 1}`} 
                        className="w-full aspect-video sm:h-[200px] md:h-[250px] object-cover rounded-lg shadow-sm"
                    />
                ))}
            </div>

            <div className='mt-6 mb-8'>
                <p className="text-sm md:text-base text-slate-700 leading-relaxed text-justify whitespace-pre-line">
                {storyInfo.story}
                </p>
            </div>

        </div>      
    </div>
  )
}

export default ViewTravelStory
