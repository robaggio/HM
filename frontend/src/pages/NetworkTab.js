import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

const NetworkTab = () => {
  const navigate = useNavigate();
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

  const handlePersonClick = (personId) => {
    navigate(`/people/${personId}`);
  };

  return (
    <div className="tab-content">
        <div className="network-actions" style={{ display: 'flex', gap: '10px' }}>
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
        <h3>Recent People</h3>

      <div className="network-content">
        {isPeopleLoading ? (
          <div className="loading-people">Loading people...</div>
        ) : (
          <div className="people-list">
            {people.map(person => (
              <div 
                key={person.id} 
                className="person-card"
                onClick={() => handlePersonClick(person.id)}
              >
                <div className="person-info">
                  <div className="person-name">{person.name}</div>
                  <div className="person-nickname">{person.nickname}</div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  marginBottom: '10px'
                }}
              />
              <input
                type="text"
                placeholder="Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  marginBottom: '20px'
                }}
              />
              <div className="modal-buttons" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddPersonModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkTab; 