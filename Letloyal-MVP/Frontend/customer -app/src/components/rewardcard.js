import React from "react";

export default function RewardCard({ reward }) {
  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h4 className="font-bold">{reward.reward}</h4>
      <p>Status: {reward.claimed ? "Claimed" : "Available"}</p>
      {!reward.claimed && (
        <button className="mt-2 px-4 py-1 bg-blue-600 text-white rounded">
          Claim Reward
        </button>
      )}
    </div>
  );
}
