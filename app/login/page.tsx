"use client";

import { useState,useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.push("/dashboard");
      }
    };

    checkUser();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
    else {
      alert("Login successful!");
      router.push("/dashboard");
    }
  };

  const goToSignup = () => {
    router.push("/signup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      
      {/* CARD */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">

        {/* LOGO / TITLE */}
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-500">
          Mentor<span className="text-green-600">Ship</span>
        </h1>

        <h2 className="text-xl font-semibold text-center mt-4  text-gray-600 ">
          Welcome back
        </h2>

        <p className="text-gray-500 text-center mb-6">
          Log in to your mentorship dashboard
        </p>

        {/* EMAIL */}
        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-600">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-600"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* PASSWORD */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1 text-gray-600">
            <label>Password</label>
            
          </div>

          <input
            type="password"
            placeholder="••••••••"
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500  text-gray-600"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg mt-4 transition"
        >
          Log In →
        </button>

        {/* DIVIDER */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-2 text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* SIGNUP */}
        <p className="text-center text-gray-600">
          Don't have an account?{" "}
          <span
            onClick={() => router.push("/signup")}
            className="text-green-600 cursor-pointer font-medium"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}