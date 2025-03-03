

import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Ensure Firebase is properly imported
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { ChevronDown } from "lucide-react";


const usernameList = [
  "commiesauraus", "r00d", "wizzie", "mrwhitebiacth", "miniii", "shaquilleoatmeal",
  "barackalabama", "samfucknows", "zindahumain", "kaleisha", "flaminghotcheetos",
  "imtooepictofail", "drizzy", "dweeb", "purplenoon", "chonkywonky", "iammclovin",
  "doritoisdoritoing", "bholechature", "pigga", "pixxxiee", "billubadmash",
  "sativaslosh", "shawarmawithmayo", "nimbupani", "sedlyf", "grillrepeller",
  "ptanahiyaar", "barfiiii", "randymarsh", "pytorture", "screech",
  "sixinchesfrenzy", "santrabilla", "beerwithoutbiceps", "thiefff", "balu",
  "maybel", "F3BD", "psicktrick", "roguedrinker", "zigmoid", "napmachine",
  "criplinganxiety", "rexthetrex", "retrixx", "flyingninja", "weshwed",
  "chuplodu", "kraxx"
];

const avatarImages = [
  "https://i.pinimg.com/736x/10/dc/3a/10dc3a1cf6783e86207fd09c17a19806.jpg", "https://i.pinimg.com/736x/ff/8f/9d/ff8f9d127fe9bf49396e11fc03ecedbe.jpg",
"https://i.pinimg.com/736x/7a/34/63/7a3463ceea61bdc285ea68b51d043632.jpg", "https://i.pinimg.com/736x/3e/c6/53/3ec653d9145ea5c63aad99ec41d11761.jpg",
"https://i.pinimg.com/736x/ef/6f/be/ef6fbe446f5e44a78042142db6dbdf9e.jpg", "https://i.pinimg.com/736x/06/0b/20/060b20909409026b1cf03ca45b5426c1.jpg",
"https://i.pinimg.com/736x/58/68/bc/5868bc65896c19c815b598a08536db7f.jpg", "https://i.pinimg.com/736x/32/6b/ff/326bff442142a73b1d039948a62d529f.jpg",
"https://i.pinimg.com/736x/37/7a/a4/377aa402daffff62dc95484e025fbaa1.jpg", "https://i.pinimg.com/736x/d8/3e/b8/d83eb8a0e0b293bde6366c36c798b1e4.jpg",
"https://i.pinimg.com/736x/ab/d9/40/abd9405cdf19e7141a1e67940ffa60ed.jpg", "https://i.pinimg.com/736x/52/03/f2/5203f232ca3e56f9e37ac03d4b09f7ac.jpg",
"https://i.pinimg.com/736x/99/7d/d7/997dd7f3382754f82b0d63f6da8a98b1.jpg", "https://i.pinimg.com/736x/a3/01/2b/a3012b31e5195171a7ad3f46d55eec2c.jpg",
"https://i.pinimg.com/736x/f6/df/a4/f6dfa42760f5df3b129ab288ccf8e3df.jpg", "https://i.pinimg.com/736x/a1/b8/cd/a1b8cdfb53c854f3424ac3c76086f64b.jpg",
"https://i.pinimg.com/736x/b4/dc/fe/b4dcfea52b3e4938003df9c232552bf7.jpg", "https://i.pinimg.com/736x/74/20/b0/7420b0ab9ba4e5606770ee1777d50fca.jpg",
"https://i.pinimg.com/736x/2d/f7/6a/2df76ad4ef4965a2e80b50a0f3f92058.jpg", "https://i.pinimg.com/736x/50/9c/89/509c89ab63de3cc468b044c3e6bc67b9.jpg",
"https://i.pinimg.com/736x/9f/f8/da/9ff8dad7f09939bd1d8f1978d142fef2.jpg", "https://i.pinimg.com/736x/0f/0e/2f/0f0e2f53cbeb62571e303503b5302dd2.jpg",
"https://i.pinimg.com/736x/08/e6/b5/08e6b54663e6fbcc2433ea2e474db6fb.jpg", "https://i.pinimg.com/736x/e4/a9/b2/e4a9b2d50e78ac939048d69d5b36eb31.jpg",
"https://i.pinimg.com/736x/31/17/7e/31177eb738c35f5cedaa3fe91ced75fd.jpg", "https://i.pinimg.com/736x/42/57/9f/42579f9b603f37a4ea5838d73a9a3c27.jpg",
"https://i.pinimg.com/736x/28/96/58/289658441469f5decd39bda9c86a6c8d.jpg", "https://i.pinimg.com/736x/cb/70/ff/cb70ff9081b23185c182f9ca68bb3f02.jpg",
"https://i.pinimg.com/736x/0a/6a/d6/0a6ad6ac0ee591a1a2b79a2dd4dc512a.jpg", "https://i.pinimg.com/736x/a8/fb/9e/a8fb9ea63831d86c457da94042d8dabd.jpg",
"https://i.pinimg.com/736x/f3/53/6f/f3536fb2cbe22257bc1b2980a66e8ae2.jpg", "https://i.pinimg.com/736x/83/f6/54/83f6546a5c69339b39f80ca5bfba9c13.jpg",
"https://i.pinimg.com/736x/3a/90/42/3a90427bff02c29f5c3afacbb310ccbe.jpg", "https://i.pinimg.com/736x/91/87/38/91873816f41cc5f189fca2004110fc81.jpg",
"https://i.pinimg.com/736x/4c/f7/74/4cf774cd89522241840bd40368e54b3b.jpg", "https://i.pinimg.com/736x/73/40/30/734030cc67ba0dfa5c80e52446fd2979.jpg"
];


const Avatar = ({ setShowHome }) => {
  const [selectedUsername, setSelectedUsername] = useState(null);
  const [takenUsernames, setTakenUsernames] = useState(new Set());
  const [isExistingUser, setIsExistingUser] = useState(null); // Track if user already has a username
  const [selectedAvatar, setSelectedAvatar] = useState(avatarImages[0]);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
{/*
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Get all taken usernames
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usernames = new Set(usersSnapshot.docs.map(doc => doc.data().username));
      setTakenUsernames(usernames);

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setSelectedUsername(userDoc.data().username);
        setSelectedAvatar(userDoc.data().avatar || avatarImages[0]);
        setIsExistingUser(true);
      }

      //to check if someone has already selected an username

      



    };

    fetchUserData();
  }, []);
  */}
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const usersSnapshot = await getDocs(collection(db, "users"));
      const usernames = new Set(usersSnapshot.docs.map(doc => doc.data().username));
      setTakenUsernames(usernames);

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedUsername(userData.username || null);
        setSelectedAvatar(userData.avatar || null);
        setIsProfileComplete(!!userData.username && !!userData.avatar);
      }
      
    };

    fetchUserData();
  }, []);
  

  const toggleUsername = () => {
    let newUsername;
    do {
      newUsername = usernameList[Math.floor(Math.random() * usernameList.length)];
    } while (takenUsernames.has(newUsername)); // Ensure the username isn't taken

    setSelectedUsername(newUsername);
  };

  const toggleAvatar = () => {
    let newAvatar;
    do {
      newAvatar = avatarImages[Math.floor(Math.random() * avatarImages.length)];
    } while (newAvatar === selectedAvatar); // Ensure a different avatar is selected
  
    setSelectedAvatar(newAvatar);
  };
  

  const saveUsername = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    {/*await setDoc(userRef, { username: selectedUsername }, { merge: true });*/}
    await setDoc(userRef, { username: selectedUsername, avatar: selectedAvatar }, { merge: true });


    localStorage.setItem(`seenAvatar_${user.uid}`, "true");
    setShowHome(true);
  };

  const saveProfile = async () => {
    const user = auth.currentUser;
    if (!user || !selectedUsername || !selectedAvatar) return;

    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { username: selectedUsername, avatar: selectedAvatar }, { merge: true });

    localStorage.setItem(`seenAvatar_${user.uid}`, "true");
    setIsProfileComplete(true);
    setShowHome(true);
  };
{/*
  return (
    <div style={styles.container}>
      <h1>Avatar</h1>

      {isExistingUser ? (
        <>
          <p>Welcome back! Your username: <strong>{selectedUsername}</strong></p>
          <button onClick={() => setShowHome(true)} style={styles.button}>
            Go to Roulette
          </button>
        </>
      ) : (
        <>
          <p>Selected: <strong>{selectedUsername || "None"}</strong></p>
          <button onClick={toggleUsername} style={styles.button}>Toggle Username</button>
          <button onClick={saveUsername} style={styles.button}>
            Confirm & Go to Roulette
          </button>
        </>
      )}
    </div>
  );*/}

  return (
    <div style={styles.container}>
      <h1> </h1>

      {isProfileComplete ? (
        <>
          <p>Welcome back!  <strong>{selectedUsername}</strong></p>
          <img src={selectedAvatar} alt="Avatar" style={styles.avatar} />
          <button onClick={() => setShowHome(true)} style={styles.button}>Roulette</button>
        </>
      ) : (
        <>
          <p>   </p>
<div style={styles.profileContainer}>
  <div style={styles.avatarWrapper}>
    <img 
      src={selectedAvatar || avatarImages[0]} 
      alt="Avatar" 
      style={styles.avatar}
    />
    {/*<p style={styles.username}>{selectedUsername || "Select Username"}</p>*/}
  </div>
  
  
</div>

{/*<button onClick={toggleAvatar} style={styles.button}>Toggle Avatar</button>*/}
<button onClick={toggleAvatar} style={styles.toggleButton}>
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Left Arrow with Stick (Upward) */}
    <path d="M7 5v10" />  {/* Vertical stick */}
    <path d="M4 10l3-3 3 3" />  {/* Upward arrow */}

    {/* Right Arrow with Stick (Downward) */}
    <path d="M17 9v10" />  {/* Vertical stick */}
    <path d="M14 15l3 3 3-3" />  {/* Downward arrow */}
  </svg>
</button>





          <p>    <strong>{selectedUsername || "None"}</strong></p>
          {/*<button onClick={toggleUsername} style={styles.button}>Toggle Username</button>*/}
          <button onClick={toggleUsername} style={styles.toggleButton}>
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Left Arrow with Stick (Upward) */}
    <path d="M7 5v10" />  {/* Vertical stick */}
    <path d="M4 10l3-3 3 3" />  {/* Upward arrow */}

    {/* Right Arrow with Stick (Downward) */}
    <path d="M17 9v10" />  {/* Vertical stick */}
    <path d="M14 15l3 3 3-3" />  {/* Downward arrow */}
  </svg>
</button>
          
          {/*
          <div style={styles.avatarContainer}>
            {avatarImages.map((avatar, index) => (
              <img 
                key={index} 
                src={avatar} 
                alt="Avatar" 
                style={{
                  ...styles.avatar, 
                  border: avatar === selectedAvatar ? "3px solid white" : "none"
                }}
                onClick={() => setSelectedAvatar(avatar)}
              />
            ))}
          </div>*/}

<button 
  onClick={saveProfile} 
  style={{ 
    ...styles.button, 
    backgroundColor: selectedUsername && selectedAvatar ? "grey" : "darkgrey",
    cursor: selectedUsername && selectedAvatar ? "pointer" : "not-allowed"
  }} 
  disabled={!selectedUsername || !selectedAvatar}
>
  Confirm
</button>



          {/*<button onClick={saveProfile} style={styles.button}>Confirm & Go to Roulette</button>*/}
        </>
      )}
    </div>
  );

};



const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#121212",
    color: "white",
    textAlign: "center",
    padding: "20px", // Padding for better spacing on small screens
  },
  button: {
    marginTop: "10px",
    padding: "8px 16px", // Smaller button size
    fontSize: "14px", // Smaller font
    cursor: "pointer",
    backgroundColor: "grey",
    color: "white",
    border: "none",
    borderRadius: "5px",
  },
  toggleButton: {
    marginTop: "10px",
    padding: "6px",
    width: "40px", // Slightly bigger for side-by-side arrows
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%", // Circular shape
    backgroundColor: "grey",
    color: "white",
    border: "none",
    cursor: "pointer",
    display: "flex",
  }
  
  ,  
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    margin: "10px",
    cursor: "pointer",
    border: "3px solid white", 
  },
  avatarContainer: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "10px",
  },

  // Responsive styles
  "@media (max-width: 768px)": { // Tablet and mobile screens
    button: {
      fontSize: "12px",
      padding: "6px 12px",
    },
    toggleButton: {
      fontSize: "10px",
      padding: "5px 10px",
    },
    avatar: {
      width: "60px", // Smaller avatar for mobile
      height: "60px",
    },
  },
};

export default Avatar;



{/*// Check if this user already has a username
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setSelectedUsername(userDoc.data().username);
        setIsExistingUser(true); // Mark that the user already has a username
      }*/}

