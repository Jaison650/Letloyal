import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import QRGenerator from "./QRGenerator";

export default function Dashboard({ user }) {
  const [amount, setAmount] = useState("");
  const [lastQR, setLastQR] = useState(null);
  const [rewards, setRewards] = useState([]);

  const handleTransaction = async () => {
    const docRef = await addDoc(collection(db, "transactions"), {
      merchant: user.uid,
      amount: parseInt(amount),
      timestamp: Date.now()
    });

    setLastQR(docRef.id);
    setAmount("");
  };

  const loadRewards = async () => {
    const merchantRef = doc(db, "merchants", user.uid);
    const merchantSnap = await getDoc(merchantRef);
    if (merchantSnap.exists()) {
      setRewards(merchantSnap.data().rewards || []);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Merchant Dashboard</h2>

      <div className="mb-6">
        <input
          className="border p-2 mr-2"
          placeholder="Enter sale amount (INR)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          className="bg-green-600 text-white px-4 py-2"
          onClick={handleTransaction}
        >
          Generate QR
        </button>
      </div>

      {lastQR && (
        <div className="mb-4">
          <h4 className="font-semibold">Latest QR Code:</h4>
          <QRGenerator transactionId={lastQR} />
        </div>
      )}

      <div>
        <h3 className="font-bold mb-2">Current Reward Rules</h3>
        {rewards.length === 0 ? (
          <p>No rewards configured</p>
        ) : (
          rewards.map((r, i) => (
            <div key={i} className="p-2 border mb-2 bg-gray-100 rounded">
              🎁 {r.name} — {r.threshold} coins
            </div>
          ))
        )}
      </div>
    </div>
  );
}
