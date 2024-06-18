import React, { useState } from 'react';

function Account() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [translatedText, setTranslatedText] = useState(null);
  const [error, setError] = useState(null);

  const signup = async () => {
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) throw new Error('Failed to create account');
      const data = await response.json();
      setMessage(data.message);

      const translateResponse = await fetch(`http://localhost:8000/translate?text=${data.message}&dest=es`);
      if (!translateResponse.ok) throw new Error('Failed to fetch translation');
      const translateData = await translateResponse.json();
      setTranslatedText(translateData.translated_text);
    } catch (err) {
      setError(err.message);
    }
  };

  const login = async () => {
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) throw new Error('Failed to login');
      const data = await response.json();
      setMessage(data.message);

      const translateResponse = await fetch(`http://localhost:8000/translate?text=${data.message}&dest=es`);
      if (!translateResponse.ok) throw new Error('Failed to fetch translation');
      const translateData = await translateResponse.json();
      setTranslatedText(translateData.translated_text);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Create Account</h2>
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
      <button onClick={signup}>Sign Up</button>
      <button onClick={login}>Log In</button>
      {message && <p>{message}</p>}
      {translatedText && <p>{translatedText}</p>}
      {error && <p>{error}</p>}
    </div>
  );
}

export default Account;
