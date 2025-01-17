import React, { useState, useEffect } from 'react';

const NetworkTab = () => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [people, setPeople] = useState([]);
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);
  const [networkStats, setNetworkStats] = useState(null);

  const fetchNetworkStats = async () => {
    try {
      const response = await fetch('/api/private/network/stat');
      const data = await response.json();
      setNetworkStats(data);
    } catch (err) {
      console.error('Error fetching network stats:', err);
    }
  };

  const fetchPeople = async () => {
    try {
      setIsPeopleLoading(true);
      const response = await fetch('/api/private/people/');
      const data = await response.json();
      setPeople(data);
    } catch (err) {
      console.error('Error fetching people:', err);
    } finally {
      setIsPeopleLoading(false);
    }
  };

  // Fetch people data and network stats when component mounts
  useEffect(() => {
    fetchPeople();
    fetchNetworkStats();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('/api/private/people/', {
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
        fetchNetworkStats(); // 刷新网络统计
        setShowAddPersonModal(false);
      });
  };

  return (
    <div className="tab-content">
      <div className="network-actions">
        <button 
          className="network-action-button"
          onClick={() => setShowAddPersonModal(true)}
        >
          <span className="material-icons">person_add</span>
          Person {networkStats && `(${networkStats.total_people})`}
        </button>
        <button 
          className="network-action-button"
          onClick={() => alert('Coming soon')}
        >
          <span className="material-icons">group_add</span>
          Unit
        </button>
      </div>
      
      {showAddPersonModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Person</h3>
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
              <div className="modal-buttons">
                <button type="submit">Add</button>
                <button 
                  type="button"
                  onClick={() => setShowAddPersonModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <h3>Recent People</h3>
      <div className="people-list">
        {isPeopleLoading ? (
          <div className="loading-people">Loading people...</div>
        ) : (
          <>
            {people.map(person => (
              <div key={person.id} className="person-card">
                <div className="person-info">
                  <div className="person-name">{person.name}</div>
                  <div className="person-nickname">{person.nickname}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkTab; 