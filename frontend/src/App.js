import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [persons, setPersons] = useState([]);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    fetch('/api/people/')
      .then(response => response.json())
      .then(data => setPersons(data));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('/api/person/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, nickname }),
    })
      .then(response => response.json())
      .then(data => {
        setPersons([data, ...persons].slice(0, 10));
        setName('');
        setNickname('');
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Person List</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
          <button type="submit">Add Person</button>
        </form>
        <ul>
          {persons.map(person => (
            <li key={person.id}>{person.name} ({person.nickname})</li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
