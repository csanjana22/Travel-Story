import React from 'react';
import ProfileInfo from './cards/ProfileInfo';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Navbar = ({
  userInfo,
  showPublicStories 
}) => {
  const isToken = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();
  
  const onLogout = () => {
    localStorage.clear();
    navigate('/');
    window.location.reload();
  };

  return (
    <div className='bg-white flex items-center justify-between px-6 py-3 drop-shadow sticky top-0 z-50'>
      <div className='font-caveat text-3xl text-primary cursor-pointer' onClick={showPublicStories}>
        Travel Story
      </div>
      <div className='flex items-center gap-8'>
        <Link to="/" className={location.pathname === '/' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}>Home</Link>
        <Link to="/" state={{ scrollTo: "stories" }} className='hover:text-cyan-600'>Explore Stories</Link>
        {isToken && userInfo && (
          <>
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}>My Dashboard</Link>
          </>
        )}
        {isToken && userInfo ? (
          <ProfileInfo userInfo={userInfo} onLogout={onLogout} />
        ) : (
          <Link
            to="/login"
            className={"hover:text-cyan-600 transition font-medium"}
          >
            Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
