import React, { useRef, useState, useEffect } from 'react'
import { FaRegFileImage } from 'react-icons/fa';
import { MdDeleteOutline } from 'react-icons/md';

const ImageSelector = ({ images, setImages, handleDeleteImages }) => {
    const inputRef = useRef(null);
    const [previewUrls, setPreviewUrls] = useState([]);

    const handleImageChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            setImages(prevImages => [...prevImages, ...files]);
        }
    };

    const handleRemoveImage = (index) => {
        setImages(prevImages => prevImages.filter((_, i) => i !== index));
        if (handleDeleteImages) {
            handleDeleteImages(index);
        }
    };

    const onChooseFile = () => {
        inputRef.current.click();
    };

    useEffect(() => {
        // Create preview URLs for all images
        const urls = images.map(image => {
            if (typeof image === 'string') {
                return image;
            } else if (image instanceof File) {
                return URL.createObjectURL(image);
            }
            return null;
        }).filter(url => url !== null);

        setPreviewUrls(urls);

        // Cleanup function to revoke object URLs
        return () => {
            urls.forEach(url => {
                if (typeof url === 'string' && !url.startsWith('http')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [images]);

    return (
        <div>
            <input
                type='file'
                accept='image/*'
                ref={inputRef}
                onChange={handleImageChange}
                className='hidden'
                multiple
            />

            {images.length === 0 ? (
                <button 
                    className='w-full h-[220px] flex flex-col items-center justify-center gap-4 bg-slate-50 rounded border border-slate-200/50' 
                    onClick={onChooseFile}
                >
                    <div className='w-14 h-14 flex items-center justify-center bg-cyan-50 rounded-full border border-cyan-100'>
                        <FaRegFileImage className='text-xl text-cyan-500'/>
                    </div>
                    <p className='text-sm text-slate-500'>Browse image files to upload (up to 5 images)</p>
                </button>
            ) : (
                <div className='grid grid-cols-2 gap-4'>
                    {previewUrls.map((url, index) => (
                        <div key={index} className='relative'>
                            <img 
                                src={url} 
                                alt={`Selected ${index + 1}`}
                                className='w-full h-[200px] object-cover rounded-lg'
                            />
                            <button 
                                className='btn-small btn-delete absolute top-2 right-2'
                                onClick={() => handleRemoveImage(index)}
                            >
                                <MdDeleteOutline className='text-lg'/>        
                            </button>
                        </div>
                    ))}
                    {images.length < 5 && (
                        <button 
                            className='w-full h-[200px] flex flex-col items-center justify-center gap-4 bg-slate-50 rounded border border-slate-200/50' 
                            onClick={onChooseFile}
                        >
                            <div className='w-10 h-10 flex items-center justify-center bg-cyan-50 rounded-full border border-cyan-100'>
                                <FaRegFileImage className='text-lg text-cyan-500'/>
                            </div>
                            <p className='text-xs text-slate-500'>Add more images</p>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default ImageSelector
