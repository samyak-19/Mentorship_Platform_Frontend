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
    <div className="p-10">
      <h1>Login</h1>
      <input
        className="border p-2"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 mt-2"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="mt-4 bg-green-500 text-white p-2" onClick={handleLogin}>
        Login
      </button>
       <div>
        <button
        className="bg-blue-500 text-white p-2 "
        onClick={goToSignup}
      >
        Don't have an account? Sign Up
      </button>
      </div> 
    </div>
  );
}