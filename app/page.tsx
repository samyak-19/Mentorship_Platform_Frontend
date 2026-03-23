"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000")
      .then(res => res.text())
      .then(data => setMessage(data));
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Mentorship Platform</h1>
      <p>Server says: {message}</p>
    </div>
  );
}