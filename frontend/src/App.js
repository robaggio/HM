import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [people, setPeople] = useState([]);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');

  // Fetch the list of people when the component mounts
  const fetchPeople = () => {
    fetch('/api/people/')
      .then(response => response.json())
      .then(data => setPeople(data));
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  // Handle form submission to add a new person
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
      .then(() => {
        setName('');
        setNickname('');
        fetchPeople(); // Refetch the list of people after adding a new person
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
          {people.map(person => (
            <li key={person.id}>{person.name} ({person.nickname})</li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
