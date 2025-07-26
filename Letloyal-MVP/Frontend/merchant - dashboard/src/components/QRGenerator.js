import React from "react";
import QRCode from "qrcode.react";

export default function QRGenerator({ transactionId }) {
  const url = `https://letloyal.dev/scan/${transactionId}`;

  return (
    <div className="mt-2">
      <QRCode value={url} size={180} />
      <p className="text-sm text-gray-600 mt-2 break-all">{url}</p>
    </div>
  );
}
