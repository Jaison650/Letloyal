import React from "react";

export default function ProgressBar({ coins }) {
  const total = 500;
  const percentage = Math.min((coins / total) * 100, 100);

  return (
    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
      <div className="bg-green-500 h-4 rounded-full" style={{ width: `${percentage}%` }}></div>
      <p className="text-xs text-gray-600">{coins} / {total} coins</p>
    </div>
  );
}
