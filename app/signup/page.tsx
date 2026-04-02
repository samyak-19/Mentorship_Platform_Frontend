"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("Signup response:", data, error);

     if (error) {
    alert("Signup error: " + error.message);
    return;
  }

    if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: data.user.id,
          role: "student", // default role
        },
      ]);

    if (profileError) {
      alert("Profile error: " + profileError.message);
    }
  }

  alert("Signup successful!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      
      {/* CARD */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">

        {/* LOGO / TITLE */}
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-500">
          Mentor<span className="text-green-600">Ship</span>
        </h1>

        <h2 className="text-xl font-semibold text-center mt-4  text-gray-600">
          Create your account
        </h2>

        <p className="text-gray-500 text-center mb-6">
          Start your mentorship journey 🚀
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
        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-600">Password</label>
          <input
            type="password"
            placeholder="Create a strong password"
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-600"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* SIGNUP BUTTON */}
        <button
          onClick={handleSignup}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg mt-2 transition"
        >
          Sign Up →
        </button>

        {/* DIVIDER */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-2 text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* LOGIN REDIRECT */}
        <p className="text-center text-gray-600">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-green-600 cursor-pointer font-medium"
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}