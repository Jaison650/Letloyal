const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.logTransaction = functions.https.onCall(async (data, context) => {
  const { customerId, transactionId } = data;

  const txnRef = db.collection("transactions").doc(transactionId);
  const txnSnap = await txnRef.get();
  if (!txnSnap.exists) throw new Error("Invalid transaction");

  const { amount, merchant } = txnSnap.data();
  const coins = Math.floor(amount);

  const custRef = db.collection("customers").doc(customerId);
  await custRef.set(
    {
      coins: {
        [merchant]: admin.firestore.FieldValue.increment(coins)
      }
    },
    { merge: true }
  );

  const rewardRules = await db.collection("merchants").doc(merchant).get();
  const { rewards } = rewardRules.data();

  for (let reward of rewards) {
    if (coins >= reward.threshold) {
      const rewardRef = custRef.collection("rewards").doc();
      await rewardRef.set({
        merchant_id: merchant,
        reward: reward.name,
        claimed: false
      });
    }
  }

  return { success: true, coinsAdded: coins };
});
