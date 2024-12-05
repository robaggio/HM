import React, { useState, useEffect } from 'react';
import './App.css';
import { initFeishuSDK } from './utils/feishu';
import FeishuRequired from './components/FeishuRequired';

function App() {
  const [people, setPeople] = useState([]);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [editingPerson, setEditingPerson] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const setupFeishu = async () => {
      try {
        const response = await fetch(`/api/settings`);
        const settings = await response.json();
        if (!settings.appid) {
          console.error('No appid found in settings');
          return;
        }

        const result = await initFeishuSDK(settings);
        if (result.success) {
          setUserInfo(result.userInfo);
          console.log('User info:', result.userInfo);
          // Fetch people data only after successful Feishu initialization
          const response = await fetch('/api/people/');
          const data = await response.json();
          setPeople(data);
        }
      } catch (err) {
        console.error('Error in setupFeishu:', err);
      } finally { 
        setIsLoading(false);
      }
    };

    setupFeishu();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!userInfo) {
    return <FeishuRequired />;
  }

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
        fetch('/api/people/')
          .then(response => response.json())
          .then(data => setPeople(data));
      });
  };

  // Handle updating a person
  const handleUpdate = (person) => {
    fetch(`/api/people/${person.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: person.name,
        nickname: person.nickname,
      }),
    })
      .then(response => response.json())
      .then(() => {
        setEditingPerson(null);
        fetch('/api/people/')
          .then(response => response.json())
          .then(data => setPeople(data));
      });
  };

  // Handle deleting a person
  const handleDelete = (personId) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      fetch(`/api/people/${personId}`, {
        method: 'DELETE',
      })
        .then(() => {
          fetch('/api/people/')
            .then(response => response.json())
            .then(data => setPeople(data));
        });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inbox':
        return (
          <div className="tab-content">
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
                  <li key={person.id}>
                    {editingPerson?.id === person.id ? (
                      <div>
                        <input
                          type="text"
                          value={editingPerson.name}
                          onChange={(e) => setEditingPerson({
                            ...editingPerson,
                            name: e.target.value
                          })}
                        />
                        <input
                          type="text"
                          value={editingPerson.nickname}
                          onChange={(e) => setEditingPerson({
                            ...editingPerson,
                            nickname: e.target.value
                          })}
                        />
                        <button onClick={() => handleUpdate(editingPerson)}>Save</button>
                        <button onClick={() => setEditingPerson(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div>
                        {person.name} ({person.nickname})
                        <button onClick={() => setEditingPerson(person)}>Edit</button>
                        <button onClick={() => handleDelete(person.id)}>Delete</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </header>
          </div>
        );
      case 'search':
        return <div className="tab-content">Search Content Coming Soon</div>;
      case 'me':
        return <div className="tab-content">Me Content Coming Soon</div>;
      default:
        return (
          <div className="tab-content">
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
                  <li key={person.id}>
                    {editingPerson?.id === person.id ? (
                      <div>
                        <input
                          type="text"
                          value={editingPerson.name}
                          onChange={(e) => setEditingPerson({
                            ...editingPerson,
                            name: e.target.value
                          })}
                        />
                        <input
                          type="text"
                          value={editingPerson.nickname}
                          onChange={(e) => setEditingPerson({
                            ...editingPerson,
                            nickname: e.target.value
                          })}
                        />
                        <button onClick={() => handleUpdate(editingPerson)}>Save</button>
                        <button onClick={() => setEditingPerson(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div>
                        {person.name} ({person.nickname})
                        <button onClick={() => setEditingPerson(person)}>Edit</button>
                        <button onClick={() => handleDelete(person.id)}>Delete</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </header>
          </div>
        );
    }
  };

  return (
    <div className="app">
      <header className="header">
        {userInfo && (
          <div className="user-info">
            <img src={userInfo.avatarUrl} alt="User avatar" className="avatar" />
            <span>Welcome, {userInfo.name}</span>
          </div>
        )}
      </header>

      <main className="main-content">
        {renderContent()}
      </main>

      <nav className="bottom-nav">
        <button
          className={`nav-button ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          <span className="material-icons">inbox</span>
          <span className="nav-label">Inbox</span>
        </button>
        <button
          className={`nav-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <span className="material-icons">search</span>
          <span className="nav-label">Search</span>
        </button>
        <button
          className={`nav-button ${activeTab === 'me' ? 'active' : ''}`}
          onClick={() => setActiveTab('me')}
        >
          <span className="material-icons">person</span>
          <span className="nav-label">Me</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
