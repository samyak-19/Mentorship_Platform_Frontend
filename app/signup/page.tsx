"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

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
    <div className="p-10">
      <h1>Signup</h1>
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
      <button className="mt-4 bg-blue-500 text-white p-2" onClick={handleSignup}>
        Signup
      </button>
    </div>
  );
}