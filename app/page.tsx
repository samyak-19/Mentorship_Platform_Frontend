"use client";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {

    // 🔥 STEP 1: CHECK USER SESSION
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        // ✅ USER LOGGED IN → GO TO DASHBOARD
        router.push("/dashboard");
      } else {
        // ❌ USER NOT LOGGED IN → GO TO LOGIN
        router.push("/login");
      }

      setCheckingAuth(false);
    };

    checkUser();

    // 🔥 STEP 2: KEEP YOUR SERVER TEST (OPTIONAL)
    fetch("https://mentorship-platform-backend-hbm1.onrender.com")
      .then(res => res.text())
      .then(data => setMessage(data));

  }, []);

  // 🔥 IMPORTANT: prevent flicker before redirect
  if (checkingAuth) {
    return <p className="p-10">Checking authentication...</p>;
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Mentorship Platform</h1>
      <p>Server says: {message}</p>
    </div>
  );
}