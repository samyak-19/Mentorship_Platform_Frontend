"use client";

import { useState,useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
const router = useRouter();  
const [loading, setLoading] = useState(true);
const [sessionId, setSessionId] = useState("");

useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
      } else {
        // ✅ LOGGED IN → allow dashboard
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // 🔥 NEW: SHOW LOADING UNTIL AUTH CHECK COMPLETE
  if (loading) {
  return <p className="p-10">Checking authentication...</p>;
  }

  const handleLogout = async () => {
  await supabase.auth.signOut(); // 🔥 clear session

  alert("Logged out successfully");

  router.push("/login"); // 🔥 redirect to login
};

const createSession = async () => {
console.log("Button clicked 🚀");

 const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    alert("User not logged in ❌");
    return;
  }

  console.log("CREATING SESSION WITH USER:", user.id); 


    const res = await fetch("http://localhost:5000/session/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mentorId:user.id,}),
    });

    const dataRes = await res.json();
    console.log("SESSION CREATED:", dataRes);
    setSessionId(dataRes.sessionId);
    router.push(`/editor/${dataRes.sessionId}`);
  };

  const joinSession = async () => {
    const res = await fetch("http://localhost:5000/session/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });

    const data = await res.json();

    if (res.ok) {
    alert("Joined successfully!");

    router.push(`/editor/${sessionId}`);
  } else {
    alert(data.message);
  }
  };

  return (
    <div className="p-10">

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 mb-4"
      >
        Logout
      </button>
      <h1 className="text-xl font-bold">Dashboard</h1>

      <button
        className="bg-blue-500 text-white p-2 mt-4"
        onClick={createSession}
      >
        Create Session
      </button>

      {sessionId && (
        <>
           <p className="mt-2">Session ID: {sessionId}</p>

          {/* 🔥 NEW: link to editor */}
          <a
            href={`/editor/${sessionId}`}
            className="text-blue-500 underline block mt-2"
          >
            Go to Editor
          </a>
        </>
      )}

      <input
        className="border p-2 mt-4"
        placeholder="Enter Session ID"
        onChange={(e) => setSessionId(e.target.value)}
      />

      <button
        className="bg-green-500 text-white p-2 mt-2"
        onClick={joinSession}
      >
        Join Session
      </button>
    </div>
  );
}