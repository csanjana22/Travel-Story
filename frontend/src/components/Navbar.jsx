import React, { useState } from 'react';
import ProfileInfo from './cards/ProfileInfo';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { MdMenu, MdClose , MdAutoAwesome} from "react-icons/md";

const Navbar = ({
  userInfo,
  showPublicStories 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isToken = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();
  
  const onLogout = () => {
    localStorage.clear();
    navigate('/');
    window.location.reload();
  };
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    // <div className='bg-white flex items-center justify-between px-6 py-3 drop-shadow sticky top-0 z-50'>
    <nav className='bg-white px-4 md:px-6 py-3 drop-shadow sticky top-0 z-50'>
      <div className='flex items-center justify-between max-w-7xl mx-auto'>
      
      <div className='font-caveat text-2xl md:text-3xl text-primary cursor-pointer' onClick={showPublicStories}>
        Travel Story
      </div>

      <div className='hidden md:flex items-center gap-8'>
        <Link to="/" className={location.pathname === '/' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}>Home</Link>
        <Link to="/" state={{ scrollTo: "stories" }} className='hover:text-cyan-600'>Explore Stories</Link>
        <Link to="/ai-planner" className={`flex items-center gap-1 ${location.pathname === '/ai-planner' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}`}>
            <MdAutoAwesome className="text-amber-500" />
            AI Planner
        </Link>
        {isToken && userInfo && (
          <>
            <Link to="/itineraries" className={location.pathname === '/itineraries' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}>My Itineraries</Link>
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}>My Dashboard</Link>
          </>
        )}
        {isToken && userInfo ? (
          <ProfileInfo userInfo={userInfo} onLogout={onLogout} />
        ) : (
          <Link
            to="/login"
            className={`transition  ${location.pathname === '/login' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}`}
          >
            Login
          </Link>
        )}
      </div>
      <div className='md:hidden flex items-center gap-4'>
           {isToken && userInfo && <ProfileInfo userInfo={userInfo} onLogout={onLogout} isMobile={true}/>}
           <button onClick={toggleMobileMenu} className='text-3xl text-slate-500'>
             {isMobileMenuOpen ? <MdClose /> : <MdMenu />}
           </button>
      </div>
    </div>
    {isMobileMenuOpen && (
        <div className='md:hidden bg-white border-t mt-3 flex flex-col gap-4 p-4 transition-all duration-300'>
          <Link to="/" onClick={toggleMobileMenu} className={location.pathname === '/' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}>Home</Link>
          <Link to="/" state={{ scrollTo: "stories" }} onClick={toggleMobileMenu} className='hover:text-cyan-600'>Explore Stories</Link>
          <Link to="/ai-planner" onClick={toggleMobileMenu} className={`flex items-center gap-1 ${location.pathname === '/ai-planner' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}`}>
            AI Travel Planner
          </Link>

          {isToken && userInfo && (
            <Link to="/dashboard" onClick={toggleMobileMenu} className={location.pathname === '/dashboard' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}>My Dashboard</Link>
          )}

          {!isToken && (
            <Link to="/login" onClick={toggleMobileMenu} className={`transition ${location.pathname === '/login' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}`}>Login</Link>
          )}
          
          {isToken && userInfo && (
            <button onClick={onLogout} className='text-left text-red-500 font-medium'>Logout</button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
