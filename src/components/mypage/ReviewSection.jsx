// src/components/mypage/ReviewSection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ReviewSection.css';

export default function ReviewSection({ reviewCount }) {
  const navigate = useNavigate();

  return (
    <div className="review-section-container">
      <h2 className="content-title">상품리뷰</h2>
      <div className="review-notice">
        <p>작성한 리뷰: {reviewCount}개</p>
        <button
          className="submit-btn"
          onClick={() => navigate('/order/orderList')}
        >
          리뷰 작성하러 가기
        </button>
      </div>
    </div>
  );
}