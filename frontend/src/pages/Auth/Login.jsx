import React,{useState} from 'react'
import PasswordInput from "../../components/Input/PasswordInput";
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    };
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setError("");


    //Login API call
    try{
      const response = await axiosInstance.post("/login",{
        email:email,
        password:password
      });
      
      if (response.data && response.data.accessToken){
        localStorage.setItem("token",response.data.accessToken);
        navigate("/dashboard");
      }
    }catch(error){
      if(
        error.response && 
        error.response.data && 
        error.response.data.message
      ){
        setError(error.response.data.message);
    }else{
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="h-screen bg-cyan-50 overflow-hidden relative">
        
        <div className="login-ui-box right-10 -top-40"/>
        <div className="login-ui-box bg-cyan-200 right-1/2 -bottom-40"/>

        <div className="h-screen flex items-center justify-center mx-auto px-20">
          <div className="w-2/4 h-[90vh] bg-login-bg-img bg-cover bg-center rounded-lg shadow-lg flex items-end p-10 z-50 ml-10">
            <div>
            <h4 className="text-white text-5xl font-semibold leading-[58px]">Capture Your <br/> Journeys</h4>
            <p className="text-white text-[15px] leading-6 pr-7 mt-4">
              Record your travel experiences and memories in your personal travel journal 
            </p>
            </div>
          </div>

          <div className="w-2/4 h-[75vh] bg-white rounded-r-lg shadow-lg shadow-cyan-200/20 p-16 mr-10 z-50">
            <form onSubmit={handleLogin}>
              <h4 className="text-2xl font-semibold mb-7">Login</h4>

              <input type="text" placeholder="Email" className="input-box"
              value={email}
              onChange={(e)=>{setEmail(e.target.value)}}
              />

               <PasswordInput value={password}
               onChange={(e)=>{setPassword(e.target.value)}}/> 

              {error && <p className="text-xs text-red-500 pb-1">{error}</p>}

              <button type="submit" className="btn-primary">LOGIN</button>
              <p className="text-xs text-slate-500 text-center my-4">Or</p>
              <button type="submit" className="btn-primary btn-light" onClick={()=>{navigate("/signUp")}}>CREATE ACCOUNT</button>

            </form>
          </div>   
        </div> 
    </div>
  )
}

export default Login

