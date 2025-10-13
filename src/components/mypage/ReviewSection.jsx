// src/components/mypage/ReviewSection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { supabase } from '@config/supabase';
import ReviewWriteModal from '@pages/review/ReviewWriteModal';
import './ReviewSection.css';

export default function ReviewSection({ reviewCount }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('writable');
  const [myReviews, setMyReviews] = useState([]);
  const [reviewableItems, setReviewableItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (user) {
      loadAllReviews();
    }
  }, [user]);

  const loadAllReviews = async () => {
    setLoading(true);
    await Promise.all([
      fetchMyReviews(),
      fetchReviewableItems()
    ]);
    setLoading(false);
  };

  // 내가 작성한 리뷰 목록
  const fetchMyReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          products (
            pid,
            name,
            thumbnail_url,
            brands (
              name
            )
          )
        `)
        .eq('uid', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyReviews(data || []);
    } catch (error) {
      console.error('리뷰 목록 조회 실패:', error);
    }
  };

  // 리뷰 작성 가능한 상품 목록
  const fetchReviewableItems = async () => {
    try {
      const { data: deliveredItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            pid,
            name,
            thumbnail_url,
            brands (
              name
            )
          ),
          orders!inner (
            oid,
            status,
            delivered_at
          )
        `)
        .eq('orders.uid', user.id)
        .eq('orders.status', 'DELIVERED');

      if (itemsError) throw itemsError;

      const { data: existingReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('oiid')
        .eq('uid', user.id);

      if (reviewsError) throw reviewsError;

      const reviewedOiids = new Set(existingReviews?.map(r => r.oiid) || []);
      let items = deliveredItems.filter(item => !reviewedOiids.has(item.oiid));

      items = items.sort((a, b) => {
        const dateA = new Date(a.orders.delivered_at);
        const dateB = new Date(b.orders.delivered_at);
        return dateB - dateA;
      });

      setReviewableItems(items);
    } catch (error) {
      console.error('리뷰 가능 상품 조회 실패:', error);
    }
  };

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleReviewSuccess = () => {
    loadAllReviews();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1);
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="review-section-container">
      <div className="review-header">
        <h2>리뷰</h2>
      </div>

      {/* 탭 */}
      <div className="review-tabs">
        <button
          className={`tab-button ${activeTab === 'writable' ? 'active' : ''}`}
          onClick={() => setActiveTab('writable')}
        >
          작성 가능한 리뷰 ({reviewableItems.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'written' ? 'active' : ''}`}
          onClick={() => setActiveTab('written')}
        >
          내 리뷰 ({myReviews.length})
        </button>
      </div>

      {/* 작성 가능한 리뷰 탭 */}
      {activeTab === 'writable' && (
        <div className="review-list">
          {reviewableItems.length > 0 ? (
            reviewableItems.map((item) => (
              <div key={item.oiid} className="review-item">
                <div className="review-badge">D-30</div>
                <div className="review-product-info">
                  <img
                    src={item.products?.thumbnail_url}
                    alt={item.product_name}
                    className="product-thumbnail"
                  />
                  <div className="product-details">
                    <p className="brand-name">
                      {item.product_brand || item.products?.brands?.name}
                    </p>
                    <p className="product-name">
                      {item.product_name || item.products?.name}
                    </p>
                  </div>
                </div>

                <div className="review-info">
                  <span className="review-date">{formatDate(item.orders.delivered_at)}</span>
                  <button
                    className="review-write-btn"
                    onClick={() => handleOpenModal(item)}
                  >
                    리뷰쓰기
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-content">
              <p>작성 가능한 리뷰가 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 내 리뷰 탭 */}
      {activeTab === 'written' && (
        <div className="review-list">
          {myReviews.length > 0 ? (
            myReviews.map((review) => (
              <div key={review.rid} className="review-item written">
                <div className="review-product-info">
                  <img
                    src={review.products?.thumbnail_url}
                    alt={review.products?.name}
                    className="product-thumbnail"
                  />
                  <div className="product-details">
                    <p className="brand-name">{review.products?.brands?.name}</p>
                    <p className="product-name">{review.products?.name}</p>
                  </div>
                </div>

                <div className="review-content">
                  <div className="review-rating">{renderStars(review.rating)}</div>
                  <h3 className="review-title">{review.title}</h3>
                  <p className="review-text">{review.content}</p>

                  {review.images && review.images.length > 0 && (
                    <div className="review-images">
                      {review.images.map((img, idx) => (
                        <img key={idx} src={img} alt={`리뷰 이미지 ${idx + 1}`} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="review-footer">
                  <span className="review-date">{formatDate(review.created_at)}</span>
                  <div className="review-actions">
                    <button className="btn-edit">수정</button>
                    <button className="btn-delete">삭제</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-content">
              <p>작성한 리뷰가 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && selectedItem && (
        <ReviewWriteModal
          orderItem={selectedItem}
          onClose={handleCloseModal}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}