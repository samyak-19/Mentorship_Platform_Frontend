"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { io, Socket } from "socket.io-client";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRef } from "react";
import { useRouter } from "next/navigation";

// ✅ TYPE
type MessageType = {
  message: string;
  time: string;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
};

export default function CodeEditor() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [user, setUser] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);
 
  
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [code, setCode] = useState("// Start coding...");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const [role, setRole] = useState<"mentor" | "student" | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const router = useRouter();

  // 🔥 LOAD USER
  useEffect(() => {
    const getUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      console.log("SESSION:", sessionData);

      if (!sessionData.session) {
        console.log("No session");
        setLoading(false);
         router.push("/login");
        return;
      }

      setUser(sessionData.session.user);
      setLoading(false);
    };

    getUser();
  }, []);

  // 🔥 SOCKET + MESSAGES
  useEffect(() => {
    if (!sessionId  || !user?.id ) return;
    
    if (socketRef.current) return;

    const newSocket = io("https://mentorship-platform-backend-hbm1.onrender.com");
    socketRef.current = newSocket;

    setMessages([]);

     newSocket.on("role", (role) => {
    console.log("ROLE:", role);
    setRole(role);
  });

    // 🔥 LOAD OLD MESSAGES
    fetch(`https://mentorship-platform-backend-hbm1.onrender.com/messages/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched messages:", data);

        if (!Array.isArray(data)) return;

        const formatted: MessageType[] = data.map((msg: any) => ({
          message: msg.message,
          time: new Date(msg.created_at).toLocaleTimeString(),
          user: {
            id: msg.sender_id,
            email: "User",
          },
        }));

        setMessages(formatted);
        setSessionLoading(false);
      })
      .catch((error) => {
      console.error("Error fetching messages:", error);
      setSessionLoading(false);
    });

    // JOIN ROOM
   if (user?.id) {
  newSocket.emit("join-session", {
    sessionId,
    userId: user.id,
  });
}

    // CODE SYNC
    newSocket.on("code-update", (newCode) => {
      setCode(newCode);
    });

    // OFFER RECEIVED (student side)
    newSocket.on("offer", async (offer) => {
    console.log("📞 OFFER RECEIVED");

     let pc = peerConnection.current;

     if (!pc) {
    pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current = pc;

    pc.ontrack = (event) => {
      console.log("🎥 RECEIVED REMOTE STREAM");

      const remote = event.streams[0];
      if (remoteVideoRef.current && remote) {
        remoteVideoRef.current.srcObject = remote;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", {
          sessionId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.current = pc;
  }

  if (!localStream) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    setLocalStream(stream);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => {
      pc!.addTrack(track, stream);
    });
  }

  await pc.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  console.log("📤 Sending answer");

  newSocket.emit("answer", { sessionId,
    answer: peerConnection.current!.localDescription, 
  });
});

// ANSWER RECEIVED (mentor side)
newSocket.on("answer", async (answer) => {
  console.log("📞 ANSWER RECEIVED");

  const pc = peerConnection.current;
  if (!pc) return;

  await pc.setRemoteDescription(new RTCSessionDescription(answer));
  
});

// ICE CANDIDATE
newSocket.on("ice-candidate", async (candidate) => {
 try {
    const pc = peerConnection.current;
    if (!pc) return;

    if (candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (err) {
    console.error("ICE error:", err);
  }
});

    // 🔥 CHAT LISTENER 
    newSocket.on("receive-message", (data) => {
      console.log("RECEIVED MESSAGE:", data);

      const formatted = {
        message: data.message,
        time: data.time || new Date().toLocaleTimeString(),
        user:{
          id: data.user?.id || "unknown",
          email: data.user?.email || "User",
          role: data.user?.role || "student",

        },
      };

      setMessages((prev) => [...prev, formatted]);
    });

    newSocket.on("session-invalid", (data) => {
    alert(data.message);
    window.location.href = "/dashboard";
  });

     // 🔥 NEW: USER LEFT
    newSocket.on("user-left", (data) => {
    setMessages((prev) => [
      ...prev,
      {
        message: data.message,
        time: data.time,
        user: { id: "system", email: "System" }, // 👈 system message
      },
    ]);
  });

    return () => {
      newSocket.off("code-update");
      newSocket.off("receive-message");
      newSocket.off("user-joined");
      newSocket.off("user-left");
      newSocket.disconnect();
    };
  }, [sessionId , user?.id]);

  useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);


  const handleChange = (value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);

    socketRef.current?.emit("code-change", {
      sessionId,
      code: newCode,
    });
  };

  // 🔥 SEND MESSAGE
  const sendMessage = () => {
    if (!message.trim() || !socketRef.current || !user) return;

    socketRef.current.emit("send-message", {
      sessionId,
      message,
      user: {
        id: user.id,
        email: user.email,
        role: "student",
      },
    });

    setMessage("");
  };

  // 🔥 NEW: TOGGLE CAMERA
const toggleCamera = async () => {
 if (!localStream) {
    await startVideo(); // 👈 start camera for student
    setCameraOn(true);
    return;
  }

  localStream.getVideoTracks().forEach((track) => {
    track.enabled = !cameraOn; // ON ↔ OFF
  });

  setCameraOn(!cameraOn);
};

// 🔥 NEW: TOGGLE MIC
const toggleMic =async () => {
   if (!localStream) {
    await startVideo(); // 🔥 start mic if not started
    setMicOn(true);
    return;
  }

  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !micOn; // MUTE ↔ UNMUTE
  });

  setMicOn(!micOn);
};
  

   // 🔥 START VIDEO (NEW)
  const startVideo = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    setLocalStream(stream);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

     if (!peerConnection.current) {
    const pc = new RTCPeerConnection(
      {
        iceServers: [
      {
        urls: "stun:stun.l.google.com:19302", }],
  });

   pc.addTransceiver("video", { direction: "recvonly" });
  pc.addTransceiver("audio", { direction: "recvonly" });


    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      const remote = event.streams[0];

      

      if (remoteVideoRef.current && remote) {
        remoteVideoRef.current.srcObject = remote;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", {
          sessionId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.current = pc;
  }

    const pc = peerConnection.current;

    stream.getTracks().forEach((track) => {
      const alreadyAdded = pc.getSenders().some(
      (sender) => sender.track === track
    );
     if (!alreadyAdded) {
    pc.addTrack(track, stream); 
  }
  });
  };

  // 🔥 START CALL (NEW)
  const startCall = async () => {
    console.log("🔥 Start Call Clicked");
  console.log("ROLE:", role);

    if (role !== "mentor") {
    console.log("❌ Not mentor");
    return;
  }
    await startVideo(); 

    const pc = peerConnection.current;
    if (!pc) {
        console.log("❌ PC missing");  
        return;    
    }

    const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

   // ✅ WAIT FOR ICE GATHERING
  await new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") {
      resolve();
    } else {
      const checkState = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", checkState);
          resolve();
        }
      };
      pc.addEventListener("icegatheringstatechange", checkState);
    }
  });

   console.log("📤 Sending offer (ICE ready)");

    socketRef.current?.emit("offer", { 
      sessionId, 
      offer: pc.localDescription,
     });
  };

  // 🔥 LOADING GUARD
  if (loading) {
    return <p className="p-10">Loading user...</p>;
  }

  // 🔥 PROTECT PAGE
 if (!user && !loading) {
  router.push("/login"); // 🔥 redirect to login
  return null;
}

  // 🔥 invalid session
if (!sessionId) {
  return <p className="p-10">Invalid session</p>;
}

// 🔥 session loading (DAY 12)
if (sessionLoading) {
  return <p className="p-10">Loading session...</p>;}

   // 🔥 COPY SESSION ID
const copySessionId = () => {
  navigator.clipboard.writeText(sessionId);
  alert("Session ID copied!");
};

// 🔥 LEAVE SESSION
const leaveSession = () => {
  router.push("/dashboard");
};

// 🔥 END SESSION (MENTOR ONLY)
const endSession = async () => {
  await fetch("https://mentorship-platform-backend-hbm1.onrender.com/session/end", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId }),
  });

  alert("Session ended");
  router.push("/dashboard");
};

  return (
  <div className="min-h-screen bg-gray-100 flex flex-col">

    {/* 🔥 HEADER (LIKE DASHBOARD) */}
    <div className="flex justify-between items-center px-6 py-4 bg-white shadow">

  {/* LEFT SIDE */}
  <div>
    <h1 className="text-xl font-bold text-gray-500">
      Mentor<span className="text-green-600">Ship</span>
    </h1>

    {/* 🔥 NEW: SESSION ID */}
    <p className="text-xs text-gray-400">
      Session: {sessionId}
    </p>
  </div>

  {/* RIGHT SIDE */}
  <div className="flex items-center gap-3 text-sm text-gray-600">

    {/* USER */}
    <span>{user?.email}</span>

    {/* 🔥 ROLE BADGE */}
    <span className="bg-gray-200 px-2 py-1 rounded text-xs">
      {role}
    </span>

    {/* 🔥 COPY BUTTON */}
    <button
      onClick={copySessionId}
      className="bg-gray-300 px-3 py-1 rounded text-xs"
    >
      Copy ID
    </button>

    {/* 🔥 END SESSION (MENTOR ONLY) */}
    {role === "mentor" && (
      <button
        onClick={endSession}
        className="bg-red-500 text-white px-3 py-1 rounded text-xs"
      >
        End
      </button>
    )}

    {/* 🔥 LEAVE */}
    <button
      onClick={leaveSession}
      className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
    >
      Leave
    </button>

  </div>
</div>

    {/* 🔥 MAIN LAYOUT */}
    <div className="flex flex-1 p-4 gap-4">

      {/* 🔥 LEFT → CODE EDITOR */}
      <div className="w-2/3 bg-white rounded-xl shadow p-3 text-gray-600">
        <h2 className="font-semibold mb-2">💻 Code Editor</h2>

        <Editor
          height="75vh"
          defaultLanguage="javascript"
          value={code}
          onChange={handleChange}
        />
      </div>

      {/* 🔥 RIGHT PANEL */}
      <div className="w-1/3 flex flex-col gap-4">

        {/* 🎥 VIDEO CARD */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2 text-gray-600">🎥 Video Call</h2>

          {/* START CALL (MENTOR ONLY) */}
          {role === "mentor" && (
            <button
              onClick={startCall}
              className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded mb-3"
            >
              Start Call
            </button>
          )}

          {/* CONTROLS */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={toggleCamera}
              className="flex-1 bg-gray-700 text-white p-2 rounded text-sm"
            >
              {cameraOn ? "Camera Off" : "Camera On"}
            </button>

            <button
              onClick={toggleMic}
              className="flex-1 bg-gray-700 text-white p-2 rounded text-sm"
            >
              {micOn ? "Mute" : "Unmute"}
            </button>
          </div>

          {/* VIDEO */}
          <div className="flex gap-2">
            <div className="w-1/2">
              <p className="text-xs text-center mb-1 text-gray-600">You</p>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full rounded border"
              />
            </div>

            <div className="w-1/2">
              <p className="text-xs text-center mb-1 text-gray-600">Other</p>
              <video
                ref={remoteVideoRef}
                autoPlay
                className="w-full rounded border"
              />
            </div>
          </div>
        </div>

        {/* 💬 CHAT CARD */}
        <div className="bg-white rounded-xl shadow flex flex-col p-4 flex-1">
          <h2 className="font-semibold mb-2 text-gray-600">💬 Chat</h2>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {messages.map((msg, index) => {
              const isSystem = msg.user?.id === "system";
              const isMe = user?.id === msg.user?.id;

              if (isSystem) {
                return (
                  <div key={index} className="text-center text-xs text-gray-400">
                    {msg.message}
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg text-sm max-w-[70%]
                    ${isMe ? "bg-green-500 text-white" : "bg-gray-200"}`}
                  >
                    <p className="text-black">{msg.message}</p>
                    <p className="text-[10px] opacity-80 text-right text-gray-600">
                      {msg.time}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef}></div>
          </div>

          {/* INPUT */}
          <div className="flex mt-3 gap-2">
            <input
              className="flex-1 border p-2 rounded text-gray-600"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-4 rounded"
            >
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
);
}