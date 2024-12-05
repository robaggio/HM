import React from 'react';
import './FeishuRequired.css';

const FeishuRequired = () => {
  return (
    <div className="feishu-required">
      <div className="feishu-required-content">
        <span className="material-icons">error_outline</span>
        <h1>请在飞书中打开</h1>
        <p>此应用程序需要在飞书环境中运行</p>
      </div>
    </div>
  );
};

export default FeishuRequired;
