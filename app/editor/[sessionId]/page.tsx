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

    const newSocket = io("http://localhost:5000");
    socketRef.current = newSocket;

    setMessages([]);

     newSocket.on("role", (role) => {
    console.log("ROLE:", role);
    setRole(role);
  });

    // 🔥 LOAD OLD MESSAGES
    fetch(`http://localhost:5000/messages/${sessionId}`)
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

  return (
    <div className="flex h-screen">
      
      {/* LEFT SIDE → CODE EDITOR */}
      <div className="w-2/3 p-4">
        <Editor
          height="80vh"
          defaultLanguage="javascript"
          value={code}
          onChange={handleChange}
        />
      </div>

      {/* RIGHT SIDE → CHAT +video */}
      <div className="w-1/3 border-l p-4 flex flex-col">

         {/* 🔥 VIDEO UI (NEW) */}
        <div className="mb-4">

  {/* 🔥 ONLY MENTOR CAN SEE START CALL */}
  {role === "mentor" && (
    <button
      onClick={startCall}
      className="bg-green-500 text-white px-4 py-2 mb-2"
    >
      Start Call
    </button>
  )}

  {/* 🔥 CAMERA + MIC CONTROLS (FOR BOTH USERS) */}
  <div className="flex gap-2 mb-2">
    <button
      onClick={toggleCamera}
      
      className="bg-gray-700 text-white px-3 py-1"
    >
      {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
    </button>

    <button
      onClick={toggleMic}
      className="bg-gray-700 text-white px-3 py-1"
    >
      {micOn ? "Mute Mic" : "Unmute Mic"}
    </button>
  </div>

      <div className="flex gap-2">
        {/* 🔥 YOUR VIDEO */}
        <div className="w-1/2">
          <p className="text-xs text-center">You</p>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full border rounded"
          />
      </div>

        {/* 🔥 OTHER USER VIDEO */}
        <div className="w-1/2">
          <p className="text-xs text-center">Other User</p>
          <video
            ref={remoteVideoRef}
            autoPlay
            className="w-full border rounded"
          />
          </div>
        </div>
      </div>

        <h2 className="font-bold mb-2">Chat</h2>

        {/*  CHAT UI */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {messages.map((msg, index) => {
            // ✅ CHECK IF MESSAGE IS FROM CURRENT USER
            const isSystem = msg.user?.id === "system";
            const isMe = user?.id === msg.user?.id;

        if (isSystem) {
        return (
        <div key={index} className="text-center text-xs text-gray-500">
          {msg.message} ({msg.time})
        </div>
      );
    }

            return (
              <div
                key={index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`
                    max-w-[70%] p-3 rounded-lg shadow
                    ${
                      isMe
                        ? "bg-blue-500 text-white" // 🔥 your messages
                        : "bg-gray-200 text-black" // 🔥 others
                    }
                  `}
                >
                  {/* 🔥 USER NAME + ROLE */}
                  <p className="text-xs font-semibold">
                    {isMe ? "You" : msg.user?.email || "User"}{" "}
                    <span className="italic text-[10px]">
                      ({msg.user?.role || "student"})
                    </span>
                  </p>

                  {/* 🔥 MESSAGE TEXT */}
                  <p className="text-sm">{msg.message}</p>

                  {/* 🔥 TIME */}
                  <p className="text-[10px] text-right opacity-70">
                    {msg.time}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef}></div>
        </div>

        {/* INPUT */}
        <div className="mt-2 flex">
          <input
            className="border p-2 flex-1"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}