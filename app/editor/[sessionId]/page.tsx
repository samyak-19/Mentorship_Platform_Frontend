"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { io, Socket } from "socket.io-client";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRef } from "react";

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState("// Start coding...");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // 🔥 LOAD USER
  useEffect(() => {
    const getUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      console.log("SESSION:", sessionData);

      if (!sessionData.session) {
        console.log("No session");
        setLoading(false); // ✅ FIX
        return;
      }

      setUser(sessionData.session.user);
      setLoading(false);
    };

    getUser();
  }, []);

  // 🔥 SOCKET + MESSAGES
  useEffect(() => {
    if (!sessionId) return;

    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    setMessages([]);

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
      });

    // JOIN ROOM
    newSocket.emit("join-session", sessionId);

    // CODE SYNC
    newSocket.on("code-update", (newCode) => {
      setCode(newCode);
    });

    // 🔥 CHAT LISTENER (FIXED FORMAT)
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

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId]);

  // CODE CHANGE
  const handleChange = (value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);

    socket?.emit("code-change", {
      sessionId,
      code: newCode,
    });
  };

  // 🔥 SEND MESSAGE (FIXED)
  const sendMessage = () => {
    if (!message || !socket || !user) return;

    socket.emit("send-message", {
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

    const pc = new RTCPeerConnection();

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      const remote = event.streams[0];
      setRemoteStream(remote);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remote;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("ice-candidate", {
          sessionId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.current = pc;
  };

  // 🔥 START CALL (NEW)
  const startCall = async () => {
    await startVideo();

    const offer = await peerConnection.current!.createOffer();
    await peerConnection.current!.setLocalDescription(offer);

    socket?.emit("offer", { sessionId, offer });
  };

  // 🔥 LOADING GUARD
  if (loading) {
    return <p className="p-10">Loading user...</p>;
  }

  // 🔥 PROTECT PAGE
  if (!user) {
    return <p className="p-10">Please login first</p>;
  }

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
          <button
            onClick={startCall}
            className="bg-green-500 text-white px-4 py-2 mb-2"
          >
            Start Call
          </button>

          <div className="flex gap-2">
            <video ref={localVideoRef} autoPlay muted className="w-1/2" />
            <video ref={remoteVideoRef} autoPlay className="w-1/2" />
          </div>
        </div>

        <h2 className="font-bold mb-2">Chat</h2>

        {/*  CHAT UI */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {messages.map((msg, index) => {
            // ✅ CHECK IF MESSAGE IS FROM CURRENT USER
            const isMe = user?.id === msg.user?.id;

            return (
              <div
                key={index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
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