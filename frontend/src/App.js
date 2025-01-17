import React, { useState, useEffect } from 'react';
import './App.css';
import { initFeishuSDK } from './utils/feishu';
import FeishuRequired from './components/FeishuRequired';
import InboxTab from './components/InboxTab';
import NetworkTab from './components/NetworkTab';
import MeTab from './components/MeTab';
import { BrowserRouter, Routes, Route } from "react-router";
import PersonProfile from './pages/PersonProfile';

// 底部导航组件
const BottomNavigation = ({ activeTab, setActiveTab, userInfo }) => {
  return (
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
              e.target.src = 'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/web/logo-icon.png';
            }}
          />
        ) : (
          <span className="material-icons">person</span>
        )}
        <span className="nav-label">{userInfo ? userInfo.name : 'Me'}</span>
      </button>
    </nav>
  );
};


function App() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const setupFeishu = async () => {
      try {
        const response = await fetch(`/api/public/settings`);
        const settings = await response.json();
        if (!settings.appid) {
          console.error('No appid found in settings');
          return;
        }

        const result = await initFeishuSDK(settings);
        if (result.success) {
          setUserInfo(result.userInfo);
          console.log('User info:', result.userInfo);
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
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!userInfo) {
    return <FeishuRequired />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/people/:personId"
          element={
              <PersonProfile />
          }
        />
        <Route
          path="/"
          element={
              <div className="app-container">
                <div className="content">
                  {activeTab === 'inbox' && <InboxTab />}
                  {activeTab === 'network' && <NetworkTab />}
                  {activeTab === 'me' && <MeTab />}
                </div>
                <BottomNavigation 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab}
                  userInfo={userInfo}
                />
              </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
