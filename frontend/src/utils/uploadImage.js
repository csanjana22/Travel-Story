import axiosInstance from "./axiosInstance";

const uploadImage = async (imageFile) => {
    const formData = new FormData();
    // Append image file to form data with the correct field name for multiple images
    formData.append('images', imageFile);

    try {
        const response = await axiosInstance.post('/image-upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.data || !response.data.imageUrls || response.data.imageUrls.length === 0) {
            throw new Error('No image URLs received from server');
        }

        return { imageUrl: response.data.imageUrls[0] };
    } catch (error) {
        console.error('Error uploading the image:', error);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            throw new Error(error.response.data.message || 'Failed to upload image');
        } else if (error.request) {
            // The request was made but no response was received
            throw new Error('No response from server');
        } else {
            // Something happened in setting up the request that triggered an Error
            throw new Error(error.message || 'Error uploading image');
        }
    }
};

export default uploadImage;