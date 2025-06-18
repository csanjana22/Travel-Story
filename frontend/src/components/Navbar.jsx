import React from 'react';
// import LOGO from '../assets/images/logo.svg';
import LOGO from '../assets/logo_name1.png';
import ProfileInfo from './cards/ProfileInfo';
import { Navigate, useNavigate } from 'react-router-dom';
import SearchBar from '../components/Input/SearchBar';

const Navbar = ({userInfo,searchQuery,setSearchQuery,onSearchNote,handleClearSearch,getAllTravelStories}) => {
  
  const isToken=localStorage.getItem('token');
  const navigate = useNavigate();

  const onLogout = () => {
    localStorage.clear();
    navigate('/login');
  }

  const handleSearch= async ()=>{
    if (!searchQuery || searchQuery.trim() === "") {
      // If search bar is empty, get all stories
      await getAllTravelStories();
      setFilterType(""); // Reset filter type if needed
      return;
    }
    onSearchNote(searchQuery);
  };

  const onClearSearch=()=>{
    handleClearSearch();
    setSearchQuery("");
  };

  return (
    <div className='bg-white flex items-center justify-between px-6 py-2 drop-shadow sticky top-0 z-10'>
      {/* <img src={LOGO} alt="Logo" className="h-12" /> */}
      <div className='font-caveat text-3xl text-primary'>Travel Story</div>

      {isToken && (
        <>
        <SearchBar
        value={searchQuery}
        onChange={(e)=>{
          setSearchQuery(e.target.value);
        }}
        handleSearch={handleSearch}
        onClearSearch={onClearSearch}
        />
       <ProfileInfo userInfo={userInfo} onLogout={onLogout}/>{" "}
      </>
    )}
    </div>
  )
}

export default Navbar
