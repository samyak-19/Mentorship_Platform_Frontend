"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import { useParams } from "next/navigation";

// 🔥 connect to backend socket
const socket = io("http://localhost:5000");

export default function CodeEditor() {
  const { sessionId } = useParams();

  const [code, setCode] = useState("// Start coding...");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { message: string; time: string }[]
  >([]);


  useEffect(() => {
    // join session room
    socket.emit("join-session", sessionId);

    // listen for code updates
    socket.on("code-update", (newCode) => {
      setCode(newCode);
    });

     // 🔥 listen for chat messages
    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("code-update");
      socket.off("receive-message");
    };
  }, [sessionId]);

  const handleChange = (value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);

    // send updated code to server
    socket.emit("code-change", {
      sessionId,
      code: newCode,
    });
  };

   // 🔥 SEND MESSAGE
  const sendMessage = () => {
    if (!message) return;

     const newMsg = {
    message,
    time: new Date().toLocaleTimeString(),
  };

  //  setMessages((prev) => [...prev, newMsg]);

    socket.emit("send-message", {
      sessionId,
      message,
    });

    setMessage("");
  };


  return (
    <div className="flex h-screen">
      
      {/* LEFT SIDE → EDITOR */}
      <div className="w-2/3 p-4">
        <h1 className="text-xl font-bold mb-2">Live Code Editor</h1>

        <Editor
          height="80vh"
          defaultLanguage="javascript"
          value={code}
          onChange={handleChange}
        />
      </div>

      {/* RIGHT SIDE → CHAT */}
      <div className="w-1/3 border-l p-4 flex flex-col">
        <h2 className="font-bold mb-2">Chat</h2>

        {/* messages */}
        <div className="flex-1 overflow-y-auto border p-2">
          {messages.map((msg, index) => (
            <div key={index} className="mb-2">
              <p className="text-sm">{msg.message}</p>
              <span className="text-xs text-gray-500">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* input */}
        <div className="mt-2 flex">
          <input
            className="border p-2 flex-1"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type message..."
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

