import React, { useState, useEffect, useRef} from "react";
import { db, auth } from "../firebase"; // Ensure firebase setup
import { collection, addDoc, getDocs, query, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";


import "./Polls.css"

const Polls = ({ setShowChatroom }) => {
  const [chatroomName, setChatroomName] = useState(""); // State for new chatroom name
  const [chatrooms, setChatrooms] = useState([]); // List of existing chatrooms
  const [activeChatroom, setActiveChatroom] = useState(null); // Selected chatroom
  const [messages, setMessages] = useState([]); // Messages in the active chatroom
  const [newMessage, setNewMessage] = useState(""); // New message input

  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatBtnRef = useRef(null);

  useEffect(() => {
    if (chatBtnRef.current) {
      setIsChatOpen(true);
    }
  }, []);

  // Fetch existing chatrooms in real-time
  useEffect(() => {
    const chatroomsRef = collection(db, "polls");
    const q = query(chatroomsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const existingChatrooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setChatrooms(existingChatrooms); // Set chatrooms state
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // Fetch messages when a chatroom is selected
  useEffect(() => {
    if (!activeChatroom) return; // If no active chatroom, don't fetch messages

    const messagesRef = collection(db, "polls", activeChatroom.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMessages(fetchedMessages); // Set messages state
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [activeChatroom]);

  // Create a new chatroom
  const createChatroom = async () => {
    if (!chatroomName.trim()) {
      alert("Chatroom name is required");
      return;
    }

    try {
      const newChatroom = await addDoc(collection(db, "polls"), {
        name: chatroomName,
        members: [auth.currentUser.uid],
        createdAt: new Date(),
      });
      setChatroomName(""); // Reset input field
      alert("Chatroom created successfully!");
    } catch (error) {
      console.error("Error creating chatroom: ", error);
    }
  };


  //edited
  const joinChatroom = (chatroom) => {
    setActiveChatroom(chatroom);
    setMessages([]); // Clear previous messages when switching
};

  // Send a message to the active chatroom
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChatroom) return; // Don't send empty messages

    try {
      await addDoc(collection(db, "polls", activeChatroom.id, "messages"), {
        senderId: auth.currentUser.uid,
        text: newMessage,
        timestamp: new Date(),
      });
      setNewMessage(""); // Clear input field
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const [users, setUsers] = useState({});

useEffect(() => {
    const fetchUsers = async () => {
        const usersData = {};

        for (const msg of messages) {
            const senderId = msg.senderId;

            // Fetch user details if not already in state
            if (!usersData[senderId]) {
                const userRef = doc(db, "users", senderId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    usersData[senderId] = userSnap.data();
                } else {
                    usersData[senderId] = { username: "Unknown", avatar: "default-avatar.png" };
                }
            }
        }

        setUsers(usersData);
    };

    if (messages.length > 0) {
        fetchUsers();
    }
}, [messages]);


  const [isChatroomListOpen, setIsChatroomListOpen] = useState(true); // Initially open

  //auto scroll
  const chatEndRef = useRef(null);
  
      useEffect(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
          }
      }, [messages]); 

  return (
    <>
    
        {/* Button to Open Chatroom */}
        {/*<button className="chat-btn" onClick={() => setIsChatOpen(true)}>
            Open Chatroom
        </button>*/}
        <div className="chat-btn" ref={chatBtnRef}></div>

        {/* Chatroom Sliding Container */}
        <div className={`chatroom-container ${isChatOpen ? "active" : ""}`}>
            <button className="close-chat-btn" onClick={() => setIsChatOpen(false)}>
                Back
            </button>

            <div className="chat-box">
                <h2 className="chat-header">Lores</h2>

                {/*TEMPORARILY DISABLED CREATING NEW CHATROOMS*/}
                {/*
                <div className="chat-box">
                    <h2>    </h2>
                    <input
                        type="text"
                        className="chat-input-field"
                        placeholder="Enter chatroom name"
                        value={chatroomName}
                        onChange={(e) => setChatroomName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault(); // Prevents new lines in multi-line inputs (if applicable)
                            createChatroom();
                          }
                        }}
                    />
                    <button className="chat-btn" onClick={createChatroom}>Create Chatroom</button>
                </div>
                */}
                

                {/* List Existing Chatrooms */}
                {/*
                <div className="chat-box">
                    <h2>Join an Existing Chatroom</h2>
                    {chatrooms.length === 0 ? (
                        <p>No chatrooms available. Create one!</p>
                    ) : (
                        <ul className="chatroom-list">
                            {chatrooms.map((chatroom) => (
                                <li key={chatroom.id} className="chatroom-item">
                                    <span>{chatroom.name}</span>
                                    <button className="chat-btn" onClick={() => joinChatroom(chatroom)}>Join</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                */}
                <div className={`chatroom-panel ${isChatroomListOpen ? "open" : ""}`}>
      <button className="close-panel-btn" onClick={() => setIsChatroomListOpen(false)}>Close</button>
      <h2>Join an Existing Chatroom</h2>

      {chatrooms.length === 0 ? (
        <p>No chatrooms available. Create one!</p>
      ) : (
        <ul className="chatroom-list">
          {chatrooms.map((chatroom) => (
            <li key={chatroom.id} className="chatroom-item">
              <span>{chatroom.name}</span>
              <button
                className="chat-btn"
                onClick={() => {
                  joinChatroom(chatroom);
                  setIsChatroomListOpen(false); // Close panel on joining
                }}
              >
                Join
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isChatroomListOpen && (
        <button className="open-panel-btn" onClick={() => setIsChatroomListOpen(true)}>☰ Open Rooms</button>
      )}
    </div>

                {/* Display Active Chatroom */}
                {activeChatroom && (
                    <div className="chat-box">
                        <h2> {activeChatroom.name}</h2>

                        {/* Display Messages */}
                        {/*div className="chat-messages">
                            {messages.length > 0 ? (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`message ${msg.senderId === "user" ? "you" : "other"}`}>
                                        <strong>{msg.senderId === "user" ? "You" : "Someone"}</strong>: {msg.text}
                                    </div>
                                ))
                            ) : (
                                <p>No messages yet. Be the first to send one!</p>
                            )}
                        </div>*/}
                        <div className="chat-messages">
    {messages.length > 0 ? (
        messages.map((msg) => {
            const sender = users[msg.senderId]; // Get user details from Firestore

            return (
                <div key={msg.id} className={`message-container ${msg.senderId === auth.currentUser.uid ? "sent" : "received"}`}>
    {/* Sender's Avatar */}
    <img src={sender?.avatar || "default-avatar.png"} alt="Avatar" className="avatar" />

    <div className="message-content">
        {/* Confession Count (number of messages) */}
        <span className="message-count">Confession {messages.length}</span> {/* Modify this to show count based on your logic */}

        {/* Message */}
        <p className="message-text">{msg.text}</p>

        {/* Timestamp */}
        <span className="message-timestamp">
            {msg.timestamp?.toDate
                ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Just now"}
        </span>
    </div>
</div>

            );
        })
    ) : (
        <p>No messages yet. Be the first to send one!</p>
    )}
    {/* Dummy div to enable auto-scroll */}
    <div ref={chatEndRef}></div>
</div>


                        {/* Input and Send Message */}
                        <div className="chat-input">
                            <input
                                type="text"
                                className="chat-input-field"
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault(); // Prevents new lines in multi-line inputs (if applicable)
                                    sendMessage();
                                  }
                                }}
                            />
                            <button className="chat-btn" onClick={sendMessage}>Send</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </>
);
  
};


export default Polls;