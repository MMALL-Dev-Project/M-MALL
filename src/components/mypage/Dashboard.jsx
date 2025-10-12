import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard({ orderStats, onMenuChange }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <h2 className="content-title">나의 쇼핑 현황</h2>

      <div className="dashboard-stats">
        <div className="stat-card" onClick={() => onMenuChange('주문 내역')}>
          <div className="stat-number">{orderStats.preparing + orderStats.paid}</div>
          <div className="stat-label">상품준비중</div>
        </div>
        <div className="stat-card" onClick={() => onMenuChange('주문 내역')}>
          <div className="stat-number">{orderStats.shipping}</div>
          <div className="stat-label">배송중</div>
        </div>
        <div className="stat-card" onClick={() => onMenuChange('주문 내역')}>
          <div className="stat-number">{orderStats.delivered}</div>
          <div className="stat-label">배송완료</div>
        </div>
      </div>

      <div className="quick-actions">
        <button onClick={() => onMenuChange('주문 내역')} className="quick-btn">
          주문 내역 보기
        </button>
        <button onClick={() => navigate('/support/inquiries')} className="quick-btn">
          1:1 문의하기
        </button>
      </div>
    </div>
  );
}