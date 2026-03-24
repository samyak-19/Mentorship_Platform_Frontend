"use client";

import { useState } from "react";

export default function Dashboard() {
  const [sessionId, setSessionId] = useState("");

  const createSession = async () => {
    const res = await fetch("http://localhost:5000/session/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mentorId: "123" }),
    });

    const data = await res.json();
    setSessionId(data.sessionId);
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
    alert(data.message);
  };

  return (
    <div className="p-10">
      <h1 className="text-xl font-bold">Dashboard</h1>

      <button
        className="bg-blue-500 text-white p-2 mt-4"
        onClick={createSession}
      >
        Create Session
      </button>

      {sessionId && (
        <p className="mt-2">Session ID: {sessionId}</p>
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