import { useState } from 'react';
import { setStoredAccessCode } from '../api';

export default function UnlockScreen({ onUnlock }) {
  const [code, setCode] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setStoredAccessCode(code.trim());
    onUnlock();
  }

  return (
    <div className="unlock-shell">
      <form className="unlock-card" onSubmit={handleSubmit}>
        <h2>Enter access code</h2>
        <p>This app is private. Enter the code you set when deploying it.</p>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Access code"
          autoFocus
        />
        <button type="submit" className="btn-primary">
          Unlock
        </button>
      </form>
    </div>
  );
}
