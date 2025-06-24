import React from 'react'
import {MdAdd, MdDeleteOutline,MdUpdate,MdClose} from 'react-icons/md'
import moment from 'moment/moment'
import {GrMapLocation} from 'react-icons/gr';

function ViewTravelStory({storyInfo,onClose,onEditClick,onDeleteClick}) {
    
  const isLandingPage = !onEditClick && !onDeleteClick;

  return (
    <div className='relative'>
        {isLandingPage && (
        <button className='absolute top-2 right-2' onClick={onClose}>
          <span className='text-xl text-slate-400'>&times;</span>
        </button>
        )}
        {!isLandingPage && (
        <div className='flex items-center justify-end'>
            <div>
                <div className='flex items-center gap-3 bg-cyan-50/50 p-2 rounded-l-lg'>
                    <button className='btn-small' onClick={onEditClick}>
                      <MdUpdate className="text-lg"/>UPDATE STORY
                    </button>
                    <button className='btn-small btn-delete' onClick={onDeleteClick}>
                      <MdDeleteOutline className="text-lg"/>Delete
                    </button>
                
        
                    <button className='' onClick={onClose}>
                      <MdClose className='text-xl text-slate-400'/>
                    </button>
                </div>
            </div>
        </div>
        )}
        <div>
            <div className="flex-1 flex flex-col gap-2 py-4">
                <h1 className="text-2xl text-slate-950">
                    {storyInfo && storyInfo.title}
                </h1>
                {/* Username below title, only if present */}
                {storyInfo?.userId?.fullName && (
                <span className="block text-sm text-slate-500 mb-1">by {storyInfo.userId.fullName}</span>
                )}                  
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                        {storyInfo && moment(storyInfo.visitedDate).format("Do MMM YYYY")}
                    </span>

                    {/* Place visibility badge above visited location */}
               {!isLandingPage && storyInfo?.visibility && (
                <span
                    className={`inline-block mt-2 mb-1 px-2 py-0.5 rounded text-xs font-semibold capitalize border 
                    ${storyInfo.visibility === 'public'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-600 border-gray-300'
                    }`}
                > {storyInfo.visibility}
                </span>
                )}

                    <div className="inline-flex items-center gap-2 text-[13px] text-cyan-600 bg-cyan-200/40 rounded px-2 py-1">
                        <GrMapLocation className="text-sm" />
                            {Array.isArray(storyInfo?.visitedLocation)
                                ? storyInfo.visitedLocation.join(', ')
                                : ''}
                    </div>
                </div>
            </div>        
                        
            <div className='grid grid-cols-2 gap-4'>
                {storyInfo?.imageUrls?.map((imageUrl, index) => (
                    <img 
                        key={index}
                        src={imageUrl} 
                        alt={`Story image ${index + 1}`} 
                        className="w-full h-[200px] object-cover rounded-lg"
                    />
                ))}
            </div>

            <div className='mt-4'>
                <p className="text-sm text-slate-950 leading-6 text-justify whitespace-pre-line">
                {storyInfo.story}
                </p>
            </div>

        </div>      
    </div>
  )
}

export default ViewTravelStory
