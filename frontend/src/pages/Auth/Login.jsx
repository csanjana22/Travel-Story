import React,{useState} from 'react'
import PasswordInput from "../../components/Input/PasswordInput";
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
import { Navigate } from 'react-router-dom';
import Modal from 'react-modal';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

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
         // Fetch user info immediately after login
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
          <div className="w-2/4 h-[80vh] bg-login-bg-img bg-cover bg-center rounded-lg shadow-lg flex items-end p-10 z-40 ml-10">
            <div>
            <h4 className="text-white text-5xl font-semibold leading-[58px]">Capture Your <br/> Journeys</h4>
            <p className="text-white text-[15px] leading-6 pr-7 mt-4">
              Record your travel experiences and memories in your personal travel journal 
            </p>
            </div>
          </div>

          <div className="w-2/4 h-[70vh] bg-white rounded-r-lg shadow-lg shadow-cyan-200/20 p-16 mr-10 z-50">
            <form onSubmit={handleLogin}>
              <h4 className="text-2xl font-semibold mb-7">Login</h4>

              <input type="text" placeholder="Email" className="input-box"
              value={email}
              onChange={(e)=>{setEmail(e.target.value)}}
              />

               <PasswordInput value={password}
               onChange={(e)=>{setPassword(e.target.value)}}/> 

               <div className="flex justify-end mb-2">
                 <button
                   type="button"
                   className="text-xs text-cyan-600 hover:underline focus:outline-none"
                   onClick={() => setShowForgotModal(true)}
                 >
                   Forgot Password?
                 </button>
               </div>

              {error && <p className="text-xs text-red-500 pb-1">{error}</p>}

              <button type="submit" className="btn-primary">LOGIN</button>
              <p className="text-xs text-slate-500 text-center my-4">Or</p>
              <button type="submit" className="btn-primary btn-light" onClick={()=>{navigate("/signUp")}}>CREATE ACCOUNT</button>

            </form>
          </div>   
        </div> 

        {/* Forgot Password Modal */}
        <Modal
          isOpen={showForgotModal}
          onRequestClose={() => setShowForgotModal(false)}
          style={{ overlay: { backgroundColor: "rgba(0,0,0,0.2)", zIndex: 999 } ,content: {
            width: "420px",         
            height: "300px",  
            margin: "auto",          
            borderRadius: "8px",
            padding: "20px",
          }}}
          className="model-box"
        >
          <div className="p-6 h-[100px] w-auto">
            <h4 className="text-lg font-semibold mb-4">Forgot Password</h4>
            <input
              type="email"
              placeholder="Enter your email"
              className="input-box mb-3"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
            />
            <button
              className="btn-primary w-full mb-2"
              onClick={async () => {
                setForgotMsg("");
                try {
                  const res = await axiosInstance.post("/request-password-reset", { email: forgotEmail });
                  setForgotMsg(res.data.message);
                } catch (err) {
                  setForgotMsg("Error sending reset link.");
                }
              }}
            >
              Send Reset Link
            </button>
            {forgotMsg && <p className="text-xs text-green-600 text-center">{forgotMsg}</p>}
            <button
              className="btn-primary btn-light w-full mt-2"
              onClick={() => {
                setShowForgotModal(false);
                setForgotMsg("");
                setForgotEmail("");
              }}
            >
              Close
            </button>
          </div>
        </Modal>
    </div>
  )
}

export default Login

