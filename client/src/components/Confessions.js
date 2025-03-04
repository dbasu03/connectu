import React, { useState, useEffect, useRef} from "react";
import { db, auth, storage } from "../firebase"; // Make sure storage is exported from firebase.js
import { collection, addDoc, getDocs, query, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import "./Confessions.css"

const Confessions = ({ setShowChatroom }) => {
  const [chatroomName, setChatroomName] = useState(""); // State for new chatroom name
  const [chatrooms, setChatrooms] = useState([]); // List of existing chatrooms
  const [activeChatroom, setActiveChatroom] = useState(null); // Selected chatroom
  const [messages, setMessages] = useState([]); // Messages in the active chatroom
  const [newMessage, setNewMessage] = useState(""); // New message input
  const [isUploading, setIsUploading] = useState(false); // Track upload status
  const [showCreateForm, setShowCreateForm] = useState(false); // To toggle create form visibility

  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatBtnRef = useRef(null);
  const fileInputRef = useRef(null); // Reference for file input

  useEffect(() => {
    if (chatBtnRef.current) {
      setIsChatOpen(true);
    }
  }, []);

  // Fetch existing chatrooms in real-time and auto-select the first one
  useEffect(() => {
    const chatroomsRef = collection(db, "confessions");
    const q = query(chatroomsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const existingChatrooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setChatrooms(existingChatrooms); // Set chatrooms state
      
      // Auto-select the first chatroom if available and no chatroom is currently selected
      if (existingChatrooms.length > 0 && !activeChatroom) {
        setActiveChatroom(existingChatrooms[0]);
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [activeChatroom]);

  // Fetch messages when a chatroom is selected
  useEffect(() => {
    if (!activeChatroom) return; // If no active chatroom, don't fetch messages

    const messagesRef = collection(db, "confessions", activeChatroom.id, "messages");
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
      const newChatroom = await addDoc(collection(db, "confessions"), {
        name: chatroomName,
        members: [auth.currentUser.uid],
        createdAt: new Date(),
      });
      setChatroomName(""); // Reset input field
      setShowCreateForm(false); // Hide the form after creation
      alert("Chatroom created successfully!");
      
      // Get the newly created chatroom data
      const docSnap = await getDoc(doc(db, "confessions", newChatroom.id));
      if (docSnap.exists()) {
        // Select the newly created chatroom
        setActiveChatroom({
          id: newChatroom.id,
          ...docSnap.data()
        });
      }
    } catch (error) {
      console.error("Error creating chatroom: ", error);
    }
  };

  // Enhanced sendMessage function with media support
  const sendMessage = async () => {
    if ((!newMessage.trim() && !file) || !activeChatroom) return; // Don't send empty messages
    
    try {
      // Prepare the message object
      const messageData = {
        senderId: auth.currentUser.uid,
        timestamp: new Date(),
      };
      
      // Add text if provided
      if (newMessage.trim()) {
        messageData.text = newMessage;
      }
      
      // Handle file upload if a file is selected
      if (file) {
        setIsUploading(true);
        const fileType = file.type.split('/')[0]; // 'image' or 'video'
        
        // Create a reference to the file in Firebase Storage
        const storageRef = ref(storage, `confession-media/${activeChatroom.id}/${Date.now()}_${file.name}`);
        
        // Upload the file
        await uploadBytes(storageRef, file);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        
        // Add media info to the message
        messageData.media = {
          type: fileType, // 'image' or 'video'
          url: downloadURL,
          fileName: file.name
        };
        
        setFile(null); // Clear the file state
        setIsUploading(false);
      }
      
      // Add the message to Firestore
      await addDoc(collection(db, "confessions", activeChatroom.id, "messages"), messageData);
      
      setNewMessage(""); // Clear input field
    } catch (error) {
      console.error("Error sending message: ", error);
      setIsUploading(false);
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

  //auto scroll
  const chatEndRef = useRef(null);
  
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  // For photos and videos
  const [file, setFile] = useState(null);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file type and size
      const fileType = selectedFile.type.split('/')[0];
      if (fileType !== 'image' && fileType !== 'video') {
        alert('Please select an image or video file.');
        return;
      }
      
      // Check file size (limit to 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (selectedFile.size > maxSize) {
        alert('File is too large. Please select a file under 10MB.');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  // Open file selector
  const openFileSelector = () => {
    fileInputRef.current.click();
  };

  // Get file preview
  const getFilePreview = () => {
    if (!file) return null;
    
    const fileType = file.type.split('/')[0];
    
    if (fileType === 'image') {
      return (
        <div className="file-preview">
          <img 
            src={URL.createObjectURL(file)} 
            alt="Selected" 
            className="preview-image" 
          />
          <button className="remove-file-btn" onClick={() => setFile(null)}>✕</button>
        </div>
      );
    } else if (fileType === 'video') {
      return (
        <div className="file-preview">
          <video 
            src={URL.createObjectURL(file)} 
            className="preview-video" 
            controls
          />
          <button className="remove-file-btn" onClick={() => setFile(null)}>✕</button>
        </div>
      );
    }
  };

  const parseMessageContent = (text) => {
    if (!text) return text;
  
    // Regex pattern to detect URLs
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/\S*)?/gi;
  
    return text.split(urlPattern).map((part, index, array) => {
      if (index < array.length - 1) {
        const match = text.match(urlPattern)[index]; // Extract the actual matched URL
        const url = match.startsWith("http") ? match : `https://${match}`; // Ensure URLs start with https://
        return (
          <React.Fragment key={index}>
            {part}
            <a href={url} target="_blank" rel="noopener noreferrer" className="message-link">
              {match}
            </a>
          </React.Fragment>
        );
      }
      return part; // Return last part of the split text
    });
  };
  
  return (
    <>
      <div className="chat-btn" ref={chatBtnRef}></div>

      <div className={`chatroom-container ${isChatOpen ? "active" : ""}`}>
        <button className="close-chat-btn" onClick={() => setIsChatOpen(false)}>
          Back
        </button>

        <div className="chat-box">
          <div className="chat-header-container">
            <h2 className="chat-header"> </h2>
            {/*
            <button 
              className="create-lore-btn" 
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? "Cancel" : "Create New Lore"}
            </button>*/}
          </div>

          {/* Create Chatroom Form - Toggle Visibility */}
          
          {showCreateForm && (
            <div className="create-chatroom-form">
              <input
                type="text"
                className="chat-input-field"
                placeholder="Enter lore name"
                value={chatroomName}
                onChange={(e) => setChatroomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    createChatroom();
                  }
                }}
              />
              <button className="chat-btn" onClick={createChatroom}>Create</button>
            </div>
          )}
            

          {/* Display Active Chatroom */}
          {activeChatroom ? (
            <div className="chat-box">
              <h2>{activeChatroom.name}</h2>

              {/* Display Messages */}
              <div className="chat-messages">
                {messages.length > 0 ? (
                  messages.map((msg, index) => {
                    const sender = users[msg.senderId]; // Get user details from Firestore
                    const isCurrentUser = msg.senderId === auth.currentUser.uid;
                    const confessionNumber = index + 1; // Calculate confession number

                    return (
                      <div key={msg.id} className={`message-container ${isCurrentUser ? "sent" : "received"}`}>
                        {/* Sender's Avatar */}
                        <img src={sender?.avatar || "default-avatar.png"} alt="Avatar" className="avatar" />

                        <div className="message-content">
                          {/* Confession Count */}
                          <span className="message-count"><strong>Confession #{confessionNumber}</strong></span>
                          
                          {/* Message Text (if any) */}
                          {msg.text && <p className="message-text">{parseMessageContent(msg.text)}</p>}

                          {/* Media Content (if any) */}
                          {msg.media && (
                            <div className="message-media">
                              {msg.media.type === 'image' ? (
                                <img 
                                  src={msg.media.url} 
                                  alt="Shared" 
                                  className="shared-image"
                                  onClick={() => window.open(msg.media.url, '_blank')}
                                />
                              ) : msg.media.type === 'video' ? (
                                <video 
                                  src={msg.media.url} 
                                  controls
                                  className="shared-video"
                                />
                              ) : null}
                            </div>
                          )}

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

              {/* File preview area */}
              {file && getFilePreview()}

              {/* Input and Send Message */}
              <div className="chat-input-container">
                <div className="chat-input">
                  <input
                    type="text"
                    className="chat-input-field"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  
                  {/* Hidden file input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                    accept="image/*,video/*"
                  />
                  
                  {/* Attach file button */}
                  <button 
                    className="attach-file-btn" 
                    onClick={openFileSelector}
                    disabled={isUploading}
                  >
                    📎
                  </button>
                  
                  <button 
                    className="chat-btn" 
                    onClick={sendMessage}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p>Loading confession page...</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Confessions;