import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getLogoSrc } from '@/utils/image';
import './LikedItems.css';

export default function LikedProducts({ likedProducts, likedBrands, onUnlike, onUnlikeBrand }) {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return price?.toLocaleString('ko-KR') + '원';
  };

  return (
    <div className="liked-products-container">
      <div className="content-header">
        <h2>나의 좋아요</h2>
      </div>

      {/* ========== 상품 좋아요 ========== */}
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

      {/* ========== 브랜드 좋아요 ========== */}
      <h3 className="section-subtitle" style={{ marginTop: '40px' }}>
        Brand ({likedBrands?.length || 0})
      </h3>

      {likedBrands && likedBrands.length > 0 ? (
        <div className="brand-grid">
          {likedBrands.map((like) => (
            <div 
              key={like.lid} 
              className="brand-card" 
              onClick={() => navigate(`/brand/${like.brands.bid}`)}
            >
              <div className="brand-card-image">
                {like.brands?.logo_url && (
                  <img 
                    src={getLogoSrc(like.brands.logo_url)} 
                    alt={like.brands.name} 
                  />
                )}
                <button
                  className="like-btn active"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnlikeBrand(like.lid, like.brands.bid);
                  }}
                >
                  ❤️
                </button>
              </div>
              
              <p className="brand-card-name">{like.brands?.name}</p>
              <p className="brand-like-count">좋아요 {like.brands?.like_count || 0}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-content">
          <p>좋아요한 브랜드가 없습니다.</p>
        </div>
      )}
    </div>
  );
}