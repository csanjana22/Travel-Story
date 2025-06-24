import React,{useState} from 'react'
import PasswordInput from "../../components/Input/PasswordInput";
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!name) {
      setError("Please enter your name.");
      return;
    };

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    };
    
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setError("");

//SignUp API call
    try{
      const response = await axiosInstance.post("/create-account",{
        fullName:name,
        email:email,
        password:password
      });
      
      if (response.data && response.data.accessToken){
        localStorage.setItem("token",response.data.accessToken);
        const userRes = await axiosInstance.get("/get-user", {
          headers: { Authorization: `Bearer ${response.data.accessToken}` }
        });
        if (userRes.data && userRes.data.user) {
          localStorage.setItem("userInfo", JSON.stringify(userRes.data.user));
        }
        navigate("/dashboard");
        window.location.reload();
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
    <div className="h-[calc(100vh-3.5rem)] bg-cyan-50 overflow-hidden relative">
        
        <div className="login-ui-box right-10 -top-40"/>
        <div className="login-ui-box bg-cyan-200 right-1/2 -bottom-40"/>

        <div className="h-full flex items-center justify-center mx-auto px-20">
          <div className="w-2/4 h-[80vh] bg-signup-bg-img bg-cover bg-center rounded-lg shadow-lg flex items-end p-10 z-50 ml-10">
            <div>
            <h4 className="text-white text-5xl font-semibold leading-[58px]">Join the <br/> Adventure</h4>
            <p className="text-white text-[15px] leading-6 pr-7 mt-4">
                Create an account to start documenting your travels and preserving your memories in your personal travel journal.
            </p>
            </div>
          </div>

          <div className="w-2/4 h-[70vh] bg-white rounded-r-lg shadow-lg shadow-cyan-200/20 p-16 mr-10 z-50">
            <form onSubmit={handleSignUp}>
              <h4 className="text-2xl font-semibold mb-7">SignUp</h4>

              <input type="text" placeholder="Full Name" className="input-box"
              value={name}
              onChange={(e)=>{setName(e.target.value)}}
              />
              <input type="text" placeholder="Email" className="input-box"
              value={email}
              onChange={(e)=>{setEmail(e.target.value)}}
              />

               <PasswordInput value={password}
               onChange={(e)=>{setPassword(e.target.value)}}/> 

              {error && <p className="text-xs text-red-500 pb-1">{error}</p>}

              <button type="submit" className="btn-primary">CREATE ACCOUNT</button>
              <p className="text-xs text-slate-500 text-center my-4">Or</p>
              <button type="submit" className="btn-primary btn-light" onClick={()=>{navigate("/login")}}>LOGIN</button>

            </form>
          </div>   
        </div> 
    </div>
  )
}

export default SignUp;
