import React, { useState, useEffect, useRef } from "react";
import { auth, db, logout, storage } from "../firebase"; // Make sure storage is exported from firebase.js
import {
  collection,
  query,
  where,
  onSnapshot, doc as firestoreDoc,
  addDoc,
  serverTimestamp,
  doc, getDocs, getDoc,
  orderBy, updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Add these imports
import "./Home.css";
import Chatroom from "./Chatroom";
import Confessions from "./Confessions";

const Home = () => {
  const [nextUser, setNextUser] = useState(null);
  const [message, setMessage] = useState("");
  const [existingChats, setExistingChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChats, setShowChats] = useState(false);
  const [showChatroom, setShowChatroom] = useState(false); 
  const [showConfessions, setShowConfessions] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const infoBoxRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!auth.currentUser) return;
  
    const userRef = doc(db, "users", auth.currentUser.uid);
  
    const setOnline = async () => {
      await updateDoc(userRef, {
        online: true,
        waiting: true,
        lastSeen: serverTimestamp(),
      });
  
      // Find another user who is online and waiting
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("waiting", "==", true),
        where("uid", "!=", auth.currentUser.uid)
      );
  
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // Pick the first available waiting user
        const waitingUser = querySnapshot.docs[0];
  
        // Ensure they haven't already been matched
        const waitingUserRef = doc(db, "users", waitingUser.id);
        const waitingUserData = waitingUser.data();
        if (!waitingUserData.waiting) return;
  
        // Match users
        await updateDoc(userRef, { waiting: false, matchedWith: waitingUser.id });
        await updateDoc(waitingUserRef, { waiting: false, matchedWith: auth.currentUser.uid });
      }
    };
  
    const setOffline = async () => {
      await updateDoc(userRef, {
        online: false,
        waiting: false,
        matchedWith: null, // Reset match on logout
        lastSeen: serverTimestamp(),
      });
    };
  
    setOnline();
    
    // Track visibility changes (minimized/closed tabs)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", setOffline);
  
    return () => {
      setOffline();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", setOffline);
    };
  }, []);

  // Function to handle clicks outside the info box
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (infoBoxRef.current && !infoBoxRef.current.contains(event.target)) {
        setIsInfoOpen(false);
      }
    };

    if (isInfoOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInfoOpen]);

  const [usernames, setUsernames] = useState({});

  useEffect(() => {
    const usersRef = collection(db, "users");

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      setUsernames((prevUsernames) => {
        const updatedUsernames = { ...prevUsernames };

        snapshot.forEach((doc) => {
          const userData = doc.data();
          
          updatedUsernames[doc.id] = userData.username || "Unknown User"; // Handle missing usernames
        });

        
        return updatedUsernames;
      });
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch existing chats
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("users", "array-contains", auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExistingChats(chatsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
  
    // Fetch the current user's data to get their matchedWith field
    const userRef = doc(db, "users", auth.currentUser.uid);
  
    const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
      if (!userDoc.exists()) return;
  
      const userData = userDoc.data();
      const matchedWith = userData.matchedWith;
  
      if (!matchedWith) return; // Ensure matchedWith exists before proceeding
  
      // Fetch the matched user
      const matchedUserRef = doc(db, "users", matchedWith);
      const unsubscribeMatchedUser = onSnapshot(matchedUserRef, (matchedUserDoc) => {
        if (matchedUserDoc.exists()) {
          setNextUser({ id: matchedUserDoc.id, ...matchedUserDoc.data() });
        }
      });
  
      return () => unsubscribeMatchedUser();
    });
  
    return () => unsubscribeUser();
  }, []);
  
  useEffect(() => {
    if (!selectedChat) return;

    // Fetch messages for selected chat
    const messagesRef = collection(db, "chats", selectedChat.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  // Function to handle file input changes
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview({
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: e.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  // Function to cancel media upload
  const cancelMediaUpload = () => {
    setSelectedFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Function to upload media file to Firebase Storage
  const uploadMedia = async (file) => {
    if (!file) return null;
    
    setIsUploading(true);
    
    try {
      const fileRef = ref(storage, `chat-media/${auth.currentUser.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      
      return {
        url: downloadURL,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        fileName: file.name
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Convert URLs to clickable links
  const linkifyText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      return `[link]${url}[/link]`;
    });
  };

  // Function to parse message content with links
  const parseMessageContent = (text) => {
    const linkPattern = /\[link\](.*?)\[\/link\]/g;
    
    if (!text || !text.match(linkPattern)) {
      return text;
    }
    
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = linkPattern.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add the link
      const url = match[1];
      parts.push(
        <a 
          key={match.index} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="message-link"
        >
          {url}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts;
  };

  const startChat = async () => {
    if (!nextUser || (!message.trim() && !selectedFile)) return;

    const currentUserId = auth.currentUser.uid;
    const matchedUserId = nextUser.id;
    const userPair = [currentUserId, matchedUserId].sort();
    const userPairId = userPair.join("_"); // Unique ID for chat

    const chatsRef = collection(db, "chats");

    // Directly query for existing chat
    const chatQuery = query(chatsRef, where("chatId", "==", userPairId));
    const chatSnapshot = await getDocs(chatQuery);

    let chatId;
    if (!chatSnapshot.empty) {
        // If chat exists, use it
        const existingChat = chatSnapshot.docs[0];
        chatId = existingChat.id;
        setSelectedChat({ id: chatId, ...existingChat.data() });
    } else {
        // Otherwise, create a new chat
        const newChat = {
            users: userPair, 
            chatId: userPairId, // Unique chat identifier
            createdAt: serverTimestamp(),
        };

        const chatRef = await addDoc(chatsRef, newChat);
        chatId = chatRef.id;
        setSelectedChat({ id: chatId, ...newChat });
    }

    // Handle media upload if there's a file
    let mediaData = null;
    if (selectedFile) {
      mediaData = await uploadMedia(selectedFile);
      setSelectedFile(null);
      setMediaPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    // Create message object
    const messageData = {
      senderId: currentUserId,
      timestamp: serverTimestamp(),
    };

    // Add text content if provided
    if (message.trim()) {
      messageData.text = linkifyText(message.trim());
    }

    // Add media content if uploaded
    if (mediaData) {
      messageData.media = mediaData;
    }

    // Send message to Firestore
    if (message.trim() || mediaData) {
      await addDoc(collection(db, "chats", chatId, "messages"), messageData);
      setMessage("");
    }

    // Set up real-time listener
    if (!selectedChat || selectedChat.id !== chatId) {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const qMessages = query(messagesRef, orderBy("timestamp", "asc"));

      const unsubscribe = onSnapshot(qMessages, (snapshot) => {
          setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });

      return () => unsubscribe();
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
  
    let chatId = selectedChat?.id;
  
    // If no existing chat, create one
    if (!chatId) {
      if (!nextUser) return; // Ensure there's a match
  
      const newChat = {
        users: [auth.currentUser.uid, nextUser.id],
        createdAt: serverTimestamp(),
      };
  
      const chatRef = await addDoc(collection(db, "chats"), newChat);
      chatId = chatRef.id;
  
      // Set as selected chat
      setSelectedChat({ id: chatId, ...newChat });
    }
  
    // Handle media upload if there's a file
    let mediaData = null;
    if (selectedFile) {
      mediaData = await uploadMedia(selectedFile);
      setSelectedFile(null);
      setMediaPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    // Create message object
    const messageData = {
      senderId: auth.currentUser.uid,
      timestamp: serverTimestamp(),
    };

    // Add text content if provided
    if (newMessage.trim()) {
      messageData.text = linkifyText(newMessage.trim());
    }

    // Add media content if uploaded
    if (mediaData) {
      messageData.media = mediaData;
    }

    // Send message to Firestore
    if (newMessage.trim() || mediaData) {
      await addDoc(collection(db, "chats", chatId, "messages"), messageData);
      setNewMessage("");
    }
  
    setNextUser(null);

    // Auto-scroll to the latest message
    setTimeout(() => {
      const chatBox = document.querySelector(".chat-container");
      if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
  };

  const [avatarUrl, setAvatarUrl] = useState(null);
  
  useEffect(() => {
    const fetchAvatar = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setAvatarUrl(userDoc.data()?.avatar);
        }
      }
    };
    fetchAvatar();
  }, []);
  
  const [matchedUser, setMatchedUser] = useState(null);
  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = firestoreDoc(db, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.matchedWith) {
          const matchedUserRef = firestoreDoc(db, "users", data.matchedWith);
          onSnapshot(matchedUserRef, (matchedDoc) => {
            if (matchedDoc.exists()) {
              setMatchedUser(matchedDoc.data());
            }
          });
        } else {
          setMatchedUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]); 

  // Fetch users from Firestore
  const [users, setUsers] = useState({}); // Store user data

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const usersData = {};
      snapshot.forEach((doc) => {
        usersData[doc.id] = doc.data();
      });
      setUsers(usersData);
    };

    fetchUsers();
  }, []);

  // Render media in message
  const renderMediaContent = (media) => {
    if (!media) return null;
    
    if (media.type === 'image') {
      return (
        <img 
          src={media.url} 
          alt="Shared image" 
          className="message-media-image" 
          onClick={() => window.open(media.url, '_blank')} 
        />
      );
    } else if (media.type === 'video') {
      return (
        <video 
          src={media.url} 
          controls 
          className="message-media-video"
        />
      );
    }
    
    return null;
  };

  return (
    <div className="home-container">
      <div className="top-bar">
        {/* Left side buttons */}
        <div className="left-buttons">
          <button className="confessions-button" onClick={() => setShowConfessions(!showConfessions)}>
            Lores
          </button>
          <button className="chatrooms-button" onClick={() => setShowChatroom(!showChatroom)}>
            Rooms
          </button>
          <button className="chats-button" onClick={() => setShowChats(!showChats)}>
            {showChats ? "Match" : "Chats"}
          </button>
        </div>

        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>

      {showConfessions ? (
        <Confessions/>
      ):(
        <div className="home-content">
          <h2></h2>
        </div>
      )}
      
      {showChats ? (
        selectedChat ? (
          <div className="chat-history">
            <h2 className="section-title"> </h2>
            <button className="back-button" onClick={() => setSelectedChat(null)}>
              Back to Chats
            </button>
            
            <div className="messages">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-container ${
                      msg.senderId === auth.currentUser.uid ? "sent" : "received"
                    }`}
                  >
                    {/* Avatar on the left for received messages */}
                    {msg.senderId !== auth.currentUser.uid && (
                      <img
                        src={users[msg.senderId]?.avatar || "/default-avatar.png"}
                        alt="Avatar"
                        className="avatar"
                      />
                    )}

                    <div className="message-content">
                      {msg.text && (
                        <p className="message-text">
                          {parseMessageContent(msg.text)}
                        </p>
                      )}
                      
                      {msg.media && renderMediaContent(msg.media)}
                      
                      <span className="message-timestamp">
                        {msg.timestamp
                          ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>

                    {/* Avatar on the right for sent messages */}
                    {msg.senderId === auth.currentUser.uid && (
                      <img
                        src={users[msg.senderId]?.avatar || "/default-avatar.png"}
                        alt="Avatar"
                        className="avatar"
                      />
                    )}
                  </div>
                ))
              ) : (
                <p className="no-messages">No messages yet.</p>
              )}

              {/* Dummy div to enable auto-scroll */}
              <div ref={chatEndRef}></div>
            </div>
            
            {/* Media preview */}
            {mediaPreview && (
              <div className="media-preview-container">
                {mediaPreview.type === 'image' ? (
                  <img src={mediaPreview.url} alt="Preview" className="media-preview" />
                ) : (
                  <video src={mediaPreview.url} className="media-preview" controls />
                )}
                <button className="cancel-media-button" onClick={cancelMediaUpload}>
                  ✕
                </button>
              </div>
            )}
            
            <div className="message-input-container">
              <button className="attach-button" onClick={() => fileInputRef.current.click()}>
                📎
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                style={{ display: 'none' }}
              />
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="message-input"
              />
              <button 
                className="send-button" 
                onClick={sendMessage}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Send"}
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-list">
            <h2 className="section-title">Roulette History</h2>
            
            {existingChats.length > 0 ? (
              existingChats.map((chat) => {
                const otherUserId = chat.users.find((id) => id !== auth.currentUser.uid); // Get the other user's ID
                const otherUsername = usernames[otherUserId] || "Unknown User"; // Get the username

                return (
                  <div
                    key={chat.id}
                    className="chat-card"
                    onClick={() => setSelectedChat(chat)}
                  >
                    <p>{otherUsername}</p> {/* Display correct username */}
                  </div>
                );
              })
            ) : (
              <p className="no-users">No chats yet.</p>
            )}
          </div>
        )
      ) : (
        <div className="chat-container">
          <h2 className="section-title">This is your next match.</h2>
          {matchedUser ? (
            <>
              <div className="image-container">
                <img src={matchedUser.avatar} alt="Image 1" className="small-image" onClick={() => setIsInfoOpen(!isInfoOpen)} />
                <div className="dot-container">
                  <span className="dot-separator">● </span>
                  <span className="dot-separator">● </span>
                  <span className="dot-separator">●</span>
                </div>
                <img src={avatarUrl} alt="User Avatar" className="small-image" />
              </div>

              {/* Clickable Left Image to Toggle Info Box */}
              <div onClick={() => setIsInfoOpen(true)} className="left-image">
                {/* Left Image Content Here */}
              </div>

              {/* Info Box (Appears when Left Image is Clicked) */}
              {isInfoOpen && (
                <div ref={infoBoxRef} className="info-box">
                  <img
                    src={matchedUser.avatar || "default-avatar.png"}  // Use default avatar if not available
                    alt="User Avatar"
                    className="user-avatar"
                  />
                  <p><strong> {matchedUser.username}</strong> </p>
                  <p>Gender: <strong>{matchedUser.gender}</strong></p>
                  <p>College: <strong>{matchedUser.college}</strong></p>
                  <p>Department: <strong>{matchedUser.department}</strong> </p>
                </div>
              )}

              <div className="chat-card">
                <div className="messages">
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`message-container ${
                          msg.senderId === auth.currentUser.uid ? "sent" : "received"
                        }`}
                      >
                        {msg.senderId !== auth.currentUser.uid && (
                          <img src={users[msg.senderId]?.avatar} alt="Avatar" className="avatar" />
                        )}
                        <div className="message-content">
                          {msg.text && (
                            <p className="message-text">
                              {parseMessageContent(msg.text)}
                            </p>
                          )}
                          
                          {msg.media && renderMediaContent(msg.media)}
                          
                          <span className="message-timestamp">
                            {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }) : ""}
                          </span>
                        </div>
                        {msg.senderId === auth.currentUser.uid && (
                          <img src={users[msg.senderId]?.avatar} alt="Avatar" className="avatar" />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="no-messages">Write an opening message to see what they have written..</p>
                  )}

                  {/* Dummy div to enable auto-scroll */}
                  <div ref={chatEndRef}></div>
                </div>

                {/* Media preview */}
                {mediaPreview && (
                  <div className="media-preview-container">
                    {mediaPreview.type === 'image' ? (
                      <img src={mediaPreview.url} alt="Preview" className="media-preview" />
                    ) : (
                      <video src={mediaPreview.url} className="media-preview" controls />
                    )}
                    <button className="cancel-media-button" onClick={cancelMediaUpload}>
                      ✕
                    </button>
                  </div>
                )}

                <div className="message-input-container">
                  <button className="attach-button" onClick={() => fileInputRef.current.click()}>
                    📎
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                  />
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        startChat();
                      }
                    }}
                    className="message-input"
                  />
                  <button 
                    className="send-button" 
                    onClick={startChat}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="no-users">Finding matches...</p>
          )}
        </div>
      )}

      {showChatroom ? (
        <Chatroom />
      ) : (
        <div className="home-content">
          <h2></h2>
        </div>
      )}
      {/*
      <footer className="footer">
        <p>Refresh the page to find new match.</p>
      </footer>*/}
    </div>
  );
};

export default Home;