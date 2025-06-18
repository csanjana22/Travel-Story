import React from 'react'
import { BrowserRouter as Router,Routes,Route,Navigate } from 'react-router-dom'
import './index.css';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import Home from './pages/Home/Home';


const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" exact element={<Root/>}/>
          <Route path="/dashboard" exact element={<Home/>}/>
          <Route path="/login" exact element={<Login/>}/>
          <Route path="/signup" exact element={<SignUp/>}/>
        </Routes>
      </Router>
    </div>
  )
}

//Define the root component to handle the initial redirect
const Root=()=>{
  //Check if token exists in localStorage
  const isAuntenticated = !!localStorage.getItem("token");
  //Redirect to dashboard if authenticated, otherwise to login
  return isAuntenticated ?(
    <Navigate to="/dashboard"/>
  ):(
    <Navigate to="/login"/>
  );
};


export default App
