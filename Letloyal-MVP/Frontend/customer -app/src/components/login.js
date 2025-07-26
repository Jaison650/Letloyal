import React, { useState } from "react";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const sendOTP = async () => {
    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {}, auth);
    const appVerifier = window.recaptchaVerifier;
    const result = await signInWithPhoneNumber(auth, "+91" + phone, appVerifier);
    setConfirmation(result);
  };

  const verifyOTP = async () => {
    const result = await confirmation.confirm(otp);
    onLogin(result.user);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold">Login with OTP</h2>
      <input className="border p-2 m-2" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
      {confirmation ? (
        <>
          <input className="border p-2 m-2" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button className="bg-blue-500 text-white px-4 py-2" onClick={verifyOTP}>Verify</button>
        </>
      ) : (
        <button className="bg-green-500 text-white px-4 py-2" onClick={sendOTP}>Send OTP</button>
      )}
      <div id="recaptcha-container"></div>
    </div>
  );
}
