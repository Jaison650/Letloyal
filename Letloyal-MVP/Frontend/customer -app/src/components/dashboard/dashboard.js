import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import ProgressBar from "./ProgressBar";
import RewardCard from "./RewardCard";

export default function Dashboard({ user }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const ref = doc(db, "customers", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile(snap.data());
      }
    };
    loadProfile();
  }, [user]);

  if (!profile) return <div className="p-4">Loading your rewards...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Welcome back!</h2>
      {Object.entries(profile.coins).map(([merchantId, coins]) => (
        <div key={merchantId} className="mb-4">
          <h3 className="font-semibold text-lg">{merchantId}</h3>
          <ProgressBar coins={coins} />
          {profile.rewards
            .filter(r => r.merchant_id === merchantId && !r.claimed)
            .map((reward, idx) => (
              <RewardCard key={idx} reward={reward} />
            ))}
        </div>
      ))}
    </div>
  );
}
