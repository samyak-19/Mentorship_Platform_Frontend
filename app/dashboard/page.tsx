"use client";

import { useState,useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
const router = useRouter();  
const [loading, setLoading] = useState(true);
const [sessionId, setSessionId] = useState("");
const [user, setUser] = useState<any>(null);

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

    const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

 return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* 🔥 HEADER */}
      <div className="flex justify-between items-center mb-8 text-gray-500">
        <h1 className="text-2xl font-bold">
          Mentor<span className="text-green-600">Hub</span>
        </h1>

        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">
            {user?.email}
          </span>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {/* 🔥 MAIN GRID */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* ✅ CREATE SESSION */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-600">
            🎯 Start Mentoring
          </h2>

          <p className="text-gray-500 mb-4">
            Create a session and start helping students in real-time.
          </p>

          <button
            onClick={createSession}
            className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg"
          >
            Create Session
          </button>
        </div>

        {/* ✅ JOIN SESSION */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">
            🚀 Join Session
          </h2>

          <p className="text-gray-500 mb-4">
            Enter session ID shared by your mentor.
          </p>

          <input
            placeholder="Enter Session ID"
            className="w-full border p-3 rounded-lg mb-4 text-gray-600"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          />

          <button
            onClick={joinSession}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg"
          >
            Join Session
          </button>
        </div>

      </div>

      {/* 🔥 EXTRA SECTION (OPTIONAL) */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-2">
          📊 Tips
        </h2>
        <ul className="text-gray-500 text-sm list-disc pl-5">
          <li>Create a session if you're a mentor</li>
          <li>Join using session ID if you're a student</li>
          <li>Use video + chat for collaboration</li>
        </ul>
      </div>

    </div>
  );
}