import React, { useState, useEffect } from 'react';

const InboxTab = () => {
  const [inboxMessages, setInboxMessages] = useState([]);

  useEffect(() => {
    const fetchInboxMessages = async () => {
      try {
        const inboxResponse = await fetch('/api/private/user/inbox');
        const inboxData = await inboxResponse.json();
        setInboxMessages(inboxData);
      } catch (err) {
        console.error('Error fetching inbox messages:', err);
      }
    };

    fetchInboxMessages();
  }, []);

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
};

export default InboxTab; 