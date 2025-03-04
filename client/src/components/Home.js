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
  orderBy, updateDoc,deleteDoc, 
  limit 
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

  const [matchedUser, setMatchedUser] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
const [matchDisconnected, setMatchDisconnected] = useState(false);
  
  const infoBoxRef = useRef(null);
  const fileInputRef = useRef(null);
{/*
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
  }, []);*/}


  //DELETE 12 HOURS INACTIVE CHATS
  useEffect(() => {
    if (!auth.currentUser) return;
  
    const deleteInactiveChats = async () => {
      const chatsRef = collection(db, "chats");
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  
      // Query chats where the user is a participant
      const q = query(
        chatsRef, 
        where("users", "array-contains", auth.currentUser.uid)
      );
  
      const chatSnapshot = await getDocs(q);
  
      chatSnapshot.forEach(async (chatDoc) => {
        const messagesRef = collection(db, "chats", chatDoc.id, "messages");
        const lastMessageQuery = query(
          messagesRef, 
          orderBy("timestamp", "desc"), 
          limit(1)
        );
  
        const lastMessageSnapshot = await getDocs(lastMessageQuery);
  
        if (!lastMessageSnapshot.empty) {
          const lastMessage = lastMessageSnapshot.docs[0].data();
          
          // Check if the last message is older than 12 hours
          if (lastMessage.timestamp && 
              lastMessage.timestamp.toDate() < twelveHoursAgo) {
            // Delete the entire chat document
            await deleteDoc(doc(db, "chats", chatDoc.id));
          }
        }
      });
    };
  
    // Run deletion check every 6 hours
    const intervalId = setInterval(deleteInactiveChats, 6 * 60 * 60 * 1000);
  
    return () => clearInterval(intervalId);
  }, []);


  const disconnectFromMatch = async () => {
    if (!auth.currentUser || !matchedUser) return;
    
    const userRef = doc(db, "users", auth.currentUser.uid);
    const matchedUserRef = doc(db, "users", matchedUser.uid);
    
    // Update both users
    await updateDoc(userRef, { 
      matchedWith: null,
      waiting: false
    });
    
    await updateDoc(matchedUserRef, { 
      matchedWith: null,
      waiting: false
    });
    
    setMatchedUser(null);
  };
  
  
  useEffect(() => {
    if (!auth.currentUser) return;
  
    const userRef = doc(db, "users", auth.currentUser.uid);
  
    const setOnline = async () => {
      await updateDoc(userRef, {
        online: true,
        waiting: false, // Changed from true to false - no longer automatically waiting
        lastSeen: serverTimestamp(),
      });
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
    
    // Rest of the effect remains the same...
  }, []);

  

  const initiateMatching = async () => {
    if (!auth.currentUser) return;
    
    setIsMatching(true);
    setMatchDisconnected(false);
    
    // Disconnect from current match if exists
    if (matchedUser && matchedUser.uid) {
      await disconnectFromMatch();
    }
    
    const userRef = doc(db, "users", auth.currentUser.uid);
    
    // Set current user as waiting
    await updateDoc(userRef, {
      waiting: true,
      matchedWith: null
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
      if (!waitingUserData.waiting) {
        setIsMatching(false);
        return;
      }
  
      // Match users
      await updateDoc(userRef, { waiting: false, matchedWith: waitingUser.id });
      await updateDoc(waitingUserRef, { waiting: false, matchedWith: auth.currentUser.uid });
    }
    
    setIsMatching(false);
  };

  const disconnectMatch = async () => {
    if (!auth.currentUser || !matchedUser) return;
    
    const userRef = doc(db, "users", auth.currentUser.uid);
    const matchedUserRef = doc(db, "users", matchedUser.uid);
    
    // Update both users
    await updateDoc(userRef, { 
      matchedWith: null,
      waiting: false
    });
    
    await updateDoc(matchedUserRef, { 
      matchedWith: null,
      waiting: false
    });
    
    setMatchDisconnected(true);
    setMatchedUser(null);
  };

  useEffect(() => {
    if (!auth.currentUser) return;
  
    const userRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // If we had a match before but now we don't, the match disconnected
        if (matchedUser && !userData.matchedWith) {
          setMatchDisconnected(true);
          setMatchedUser(null);
        }
      }
    });
  
    return () => unsubscribe();
  }, [matchedUser]);

  const toggleShowChats = async () => {
    if (!showChats && matchedUser) {
      await disconnectFromMatch();
    }
    setShowChats(!showChats);
    if (showChats) {
      setSelectedChat(null);
    }
  };
  
  const toggleShowChatroom = async () => {
    if (!showChatroom && matchedUser) {
      await disconnectFromMatch();
    }
    setShowChatroom(!showChatroom);
  };
  useEffect(() => {
    setShowChatroom(false);
}, []);
  
  const toggleShowConfessions = async () => {
    if (!showConfessions && matchedUser) {
      await disconnectFromMatch();
    }
    setShowConfessions(!showConfessions);
  };
  //TILL HERE

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
      {/*
      <div className="top-bar">
        <div className="left-buttons">
          <button className="confessions-button" onClick={toggleShowConfessions}>
            Lores
          </button>
          <button className="chatrooms-button" onClick={toggleShowChatroom}>
            Rooms
          </button>
          <button className="chats-button" onClick={toggleShowChats}>
            {showChats ? "Match" : "Chats"}
          </button>
        </div>

        <button
  className="logout-button"
  onClick={() => {
    const isConfirmed = window.confirm("Are you sure you want to logout?");
    if (isConfirmed) {
      logout();
    }
  }}
>
  Logout
</button>
      </div>
      */}

<div className="top-bar">
  {/* Logout button at the top in a narrow area */}
  <div className="logout-container">
    <button
      className="logout-button"
      onClick={() => {
        const isConfirmed = window.confirm("Are you sure you want to logout?");
        if (isConfirmed) {
          logout();
        }
      }}
    >
      Logout
    </button>
  </div>

  {/* Options below the logout button */}
  <div className="menu-options">
    <button className="menu-button" onClick={toggleShowConfessions}>
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpZ9dwo_3lERhSg8_bBseKatwiJ0t67zz1Vw&s" alt="Confessions" className="menu-icon" />
      <span>Lores</span>
    </button>

    <button className="menu-button" onClick={toggleShowChatroom}>
      <img src="data:image/png;base64,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" alt="Chatrooms" className="menu-icon" />
      <span>Rooms</span>
    </button>

    <button className="menu-button" onClick={toggleShowChats}>
      <div className="chat-toggle">
      <img 
  src={showChats ? "data:image/png;base64,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" : "data:image/png;base64,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"} 
  alt="Chats/Match" 
  className="menu-icon" 
/>

</div>
      <span>{showChats ? "Match" : "Chats"}</span>
    </button>
  </div>
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
          {matchDisconnected && (
    <div className="disconnection-notice">
      <p>Your match has disconnected.</p>
    </div>
  )}
  
  {!showChats  && (
    <button 
      className="match-button" 
      onClick={initiateMatching}
      disabled={isMatching}
    >
      {isMatching ? "Finding match..." : "Find new match"}
    </button>
  )}

          {matchedUser ? (
            <>
            {/*<button className="disconnect-button" onClick={disconnectMatch}>
        Disconnect
      </button>*/}
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
            <p className="no-users">
      {isMatching ? "Finding matches..." : "Click 'Find new match' to find someone to chat with"}
    </p>
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