import React, { useState, useEffect } from 'react';

const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
};

const InboxTab = () => {
  const [inboxMessages, setInboxMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchInboxMessages();
  }, []);

  const fetchInboxMessages = async () => {
    try {
      const inboxResponse = await fetch('/api/private/user/inbox');
      const inboxData = await inboxResponse.json();
      setInboxMessages(inboxData);
    } catch (err) {
      console.error('Error fetching inbox messages:', err);
    }
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMessage(null);
  };

  const handleMarkAsRead = async () => {
    if (!selectedMessage || selectedMessage.read) return;

    try {
      const response = await fetch(`/api/private/user/inbox/${selectedMessage.id}/read`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update the message in the local state
        setInboxMessages(messages =>
          messages.map(msg =>
            msg.id === selectedMessage.id ? { ...msg, read: true } : msg
          )
        );
        // Update the selected message
        setSelectedMessage({ ...selectedMessage, read: true });
        // Close the dialog
        handleCloseDialog();
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  return (
    <div className="tab-content">
      <div className="messages-list">
        {inboxMessages.map(message => (
          <div 
            key={message.id} 
            className="message-card"
            onClick={() => handleMessageClick(message)}
            style={{ cursor: 'pointer' }}
          >
            <div className="message-header">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {!message.read && <span className="unread-badge" />}
                <span className="message-sender">{message.message_type || 'System'}</span>
              </div>
              <span className="message-date">
                {formatRelativeTime(message.date)}
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

      {dialogOpen && selectedMessage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Message</h3>
            <div className="modal-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="message-type">{selectedMessage.message_type || 'System'}</div>
                <div className="message-time">{new Date(selectedMessage.date).toLocaleString()}</div>
              </div>
            </div>
            <div className="modal-body">
              <div className="message-content">{selectedMessage.text}</div>
            </div>
            <h3 style={{ fontSize: '1em', marginTop: '20px', marginBottom: '10px' }}>Actions</h3>
            <div className="modal-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!selectedMessage.read && (
                <button 
                  onClick={handleMarkAsRead}
                  className="btn btn-primary"
                >
                  Mark as read
                </button>
              )}
              <button 
                onClick={handleCloseDialog}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxTab; 