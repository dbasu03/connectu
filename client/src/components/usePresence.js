import { useEffect } from "react";
import { auth, rtdb } from "../firebase";
import { ref, set, remove } from "firebase/database";

const usePresence = () => {
  useEffect(() => {
    const updateStatus = (isActive) => {
      if (!auth.currentUser) return;

      const userStatusRef = ref(rtdb, `activeUsers/${auth.currentUser.uid}`);

      if (isActive) {
        set(userStatusRef, { active: true, lastSeen: Date.now() });
      } else {
        remove(userStatusRef);
      }
    };

    const handleVisibilityChange = () => {
      updateStatus(!document.hidden);
    };

    const handleBeforeUnload = () => {
      updateStatus(false);
    };

    // Track visibility and close event
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Initial update
    updateStatus(!document.hidden);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updateStatus(false); // Mark user as inactive when hook unmounts
    };
  }, []);
};

export default usePresence;
