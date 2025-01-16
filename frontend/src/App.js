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
  const [inboxMessages, setInboxMessages] = useState([]);
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);

  const fetchPeople = async () => {
    try {
      setIsPeopleLoading(true);
      const response = await fetch('/api/people/');
      const data = await response.json();
      setPeople(data);
    } catch (err) {
      console.error('Error fetching people:', err);
    } finally {
      setIsPeopleLoading(false);
    }
  };

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
          // fetch the inbox messages
          const inboxResponse = await fetch('/api/inbox');
          const inboxData = await inboxResponse.json();
          setInboxMessages(inboxData);
        }
      } catch (err) {
        console.error('Error in setupFeishu:', err);
      } finally { 
        setIsLoading(false);
      }
    };

    setupFeishu();
  }, []);

  // Fetch people data when switching to the network tab
  useEffect(() => {
    if (activeTab === 'network') {
      fetchPeople();
    }
  }, [activeTab]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!userInfo) {
    return <FeishuRequired />;
  }

  // Handle form submission to add a new person
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('/api/people/', {
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
        fetchPeople();
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
        fetchPeople();
      });
  };

  // Handle deleting a person
  const handleDelete = (personId) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      fetch(`/api/people/${personId}`, {
        method: 'DELETE',
      })
        .then(() => {
          fetchPeople();
        });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inbox':
        return (
          <div className="tab-content">
            <div className="messages-list">
              {inboxMessages.map(message => (
                <div key={message.id} className="message-card">
                  <div className="message-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {!message.read && <span className="unread-badge" />}
                      <span className="message-sender">{message.message_type || 'System'}</span>
                    </div>
                    <span className="message-date">
                      {new Date(message.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="message-text">{message.text}</div>
                </div>
              ))}
              {inboxMessages.length === 0 && (
                <div className="no-messages">
                  <span className="material-icons" style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }}>
                    inbox
                  </span>
                  <div>Your inbox is empty</div>
                </div>
              )}
            </div>
          </div>
        );
      case 'network':
        return (
          <div className="tab-content">
              <form onSubmit={handleSubmit} className="add-person-form">
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
              <div className="people-list">
                {isPeopleLoading ? (
                  <div className="loading-people">Loading people...</div>
                ) : (
                  <>
                    {people.map(person => (
                      <div key={person.id} className="person-card">
                        {editingPerson?.id === person.id ? (
                          <div className="edit-form">
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
                            <div className="button-group">
                              <button onClick={() => handleUpdate(editingPerson)}>Save</button>
                              <button onClick={() => setEditingPerson(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="person-info">
                            <div className="person-name">{person.name}</div>
                            <div className="person-nickname">{person.nickname}</div>
                            <div className="button-group">
                              <button onClick={() => setEditingPerson(person)}>Edit</button>
                              <button onClick={() => handleDelete(person.id)}>Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
          </div>
        );
      case 'me':
        return <div className="tab-content">Me Content Coming Soon</div>;
      default:
        return null;
    }
  };

  return (
    <div className="app">

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
          className={`nav-button ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <span className="material-icons">people</span>
          <span className="nav-label">Network</span>
        </button>
        <button
          className={`nav-button ${activeTab === 'me' ? 'active' : ''}`}
          onClick={() => setActiveTab('me')}
        >
          {userInfo && userInfo.avatar_url ? (
            <img 
              src={userInfo.avatar_url} 
              alt="Profile" 
              className="avatar"
              style={{ width: '28px', height: '28px', borderRadius: '50%' }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/28';
              }}
            />
          ) : (
            <span className="material-icons">person</span>
          )}
          <span className="nav-label">{userInfo ? userInfo.name : 'Me'}</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
