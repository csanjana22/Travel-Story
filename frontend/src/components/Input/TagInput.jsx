import React, { useState } from 'react'
import { GrMapLocation } from 'react-icons/gr';
import { MdAdd,MdClose } from 'react-icons/md'

const TagInput = ({location, setLocation}) => {

    const [inputValue, setInputValue] = useState(location?.name || "");
    
    const updateLocation = () => {
        const locationName = inputValue.trim();
        if (locationName) {
            setLocation({...location, name: locationName});
        }
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            updateLocation();
        }
    };

    const handleRemoveLocation = () => {
        setLocation({...location, name: ""});
        setInputValue("");
    }

    return (
        <div>
            {location?.name && (
                <div className='flex items-center gap-2 flex-wrap mt-2'>
                    <span className='flex items-center gap-2 text-sm text-cyan-600 bg-cyan-200/40 px-3 py-1 rounded'>
                        <GrMapLocation className='text-sm'/>{location.name}
                        <button onClick={handleRemoveLocation}>
                            <MdClose/>
                        </button>
                    </span>
                </div>
            )}
            <div className='flex items-center gap-4 mt-3'>
                <input 
                    type='text'
                    value={inputValue}
                    className='text-sm bg-transparent border px-3 py-2 rounded outline-none'
                    placeholder='Add Location'
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />

                <button type="button" className='w-8 h-8 flex items-center justify-center rounded border border-cyan-500 hover:bg-cyan-500' onClick={updateLocation}>
                    <MdAdd className='text-2xl text-cyan-500 hover:text-white'/>
                </button>
            </div>
        </div>
    )
}

export default TagInput
