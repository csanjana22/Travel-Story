# Travel Story App

A full-stack web application for sharing and managing travel stories, built with React (frontend) and Node.js/Express/MongoDB (backend).

## Features

- User authentication (sign up, login, password reset)
- Add, edit, delete travel stories with images and locations
- Mark stories as favourite
- Search and filter stories by date or keywords
- Public/private story visibility
- Responsive UI with Tailwind CSS

## Project Structure

```
backend/
  ├── assets/              # Static assets (placeholder images)
  ├── models/              # Mongoose models
  ├── uploads/             # Uploaded images
  ├── config.js            # DB config
  ├── index.js             # Express server
  ├── multer.js            # Image upload middleware
  ├── utilities.js         # Auth utilities
  └── package.json
frontend/
  ├── public/              # Static files
  ├── src/
  │   ├── assets/          # Images
  │   ├── components/      # Reusable UI components
  │   ├── pages/           # App pages (Home, Auth, Landing)
  │   └── utils/           # Helper functions, axios instance
  ├── index.html
  └── package.json
```

## Getting Started



### Backend Setup

1. `cd backend`
2. Install dependencies:  
   `npm install`
3. Create `.env` file (see `.env.example` if available) with your MongoDB connection string and JWT secret.
4. Start server:  
   `node index.js`  
   (or `npm run dev` if you use nodemon)

### Frontend Setup

1. `cd frontend`
2. Install dependencies:  
   `npm install`
3. Start development server:  
   `npm run dev`

### Environment Variables

- **Backend**:  
  - `ACCESS_TOKEN_SECRET` (JWT secret)
  - `MONGO_URI` (MongoDB connection string)

## Usage

- Register and log in.
- Add new travel stories with images, location, and date.
- Edit or delete your stories.
- Mark/unmark stories as favourite.
- Search and filter your stories.
- View public stories from all users.

## Technologies

- **Frontend:** React, Tailwind CSS, Axios, React Toastify
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Multer



**Note:**  
- Uploaded images are stored in `backend/uploads/` (excluded from git).
- Default images are in `backend/assets/`.
