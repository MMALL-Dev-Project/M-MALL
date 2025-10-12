import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LikedProducts.css';

export default function LikedProducts({ likedProducts, onUnlike }) {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return price?.toLocaleString('ko-KR') + '원';
  };

  return (
    <div className="liked-products-container">
      <div className="content-header">
        <h2>나의 좋아요</h2>
      </div>

      <h3 className="section-subtitle">Product ({likedProducts.length})</h3>

      {likedProducts.length > 0 ? (
        <div className="product-grid">
          {likedProducts.map((like) => (
            <div 
              key={like.lid} 
              className="product-card" 
              onClick={() => navigate(`/product/${like.products.pid}`)}
            >
              <div className="product-card-image">
                {like.products?.thumbnail_url && (
                  <img src={like.products.thumbnail_url} alt={like.products.name} />
                )}
                <button
                  className="like-btn active"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnlike(like.lid, like.products.pid);
                  }}
                >
                  ❤️
                </button>
              </div>
              
              {/* 브랜드명 */}
              <p 
                className="product-card-brand"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/brand/${like.products?.brands?.bid}`);
                }}
                style={{ cursor: 'pointer' }}
              >
                {like.products?.brands?.name}
              </p>
              
              <p className="product-card-name">{like.products?.name}</p>
              <p className="product-card-price">{formatPrice(like.products?.price)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-content">
          <p>좋아요한 상품이 없습니다.</p>
        </div>
      )}
    </div>
  );
}