import React, { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  return (
    <div className="min-h-screen bg-white">
      {!user ? <Login onLogin={setUser} /> : <Dashboard user={user} />}
    </div>
  );
}

export default App;
