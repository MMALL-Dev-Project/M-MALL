import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { supabase } from '@config/supabase';
import ReviewWriteModal from '@pages/review/ReviewWriteModal';
import './ReviewSection.css';

export default function ReviewSection({ reviewCount, initialTab }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab || 'writable');

  const [myReviews, setMyReviews] = useState([]);
  const [reviewableItems, setReviewableItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingReview, setEditingReview] = useState(null);

  // 이미지 모달
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);

  useEffect(() => {
    if (user) {
      loadAllReviews();
    }
  }, [user]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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

  // 리뷰 작성 모달
  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setEditingReview(null); // 새 리뷰 작성이므로 null
    setIsModalOpen(true);
  };

  // 리뷰 수정 모달 열기
  const handleEditReview = (review) => {
    setEditingReview(review); // 수정할 리뷰 데이터 전달
    setSelectedItem(null); // 수정 시에는 orderItem 필요 x
    setIsModalOpen(true);
  };

  // 리뷰 삭제
  const handleDeleteReview = async (rid) => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) {
      return;
    }

    try {
      // supabase에서 리뷰 삭제
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('rid', rid)
        .eq('uid', user.id); // 본인 리뷰만 삭제 가능

      if (error) throw error;

      alert('리뷰가 삭제되었습니다.');

      // 리뷰 목록 새로고침
      loadAllReviews();
    } catch (error) {
      console.error('리뷰 삭제 실패:', error)
      alert('리뷰 삭제에 실패했습니다.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setEditingReview(null); // 수정 데이터도 초기화
  };

  const handleReviewSuccess = () => {
    loadAllReviews();
  };

  // 이미지 클릭
  const handleImageClick = (images, index) => {
    setAllImages(images);
    setCurrentImageIndex(index);
    setSelectedImage(images[index]);
    setImageModalOpen(true);
  }

  // 이전 이미지
  const handlePrevImage = () => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : allImages.length - 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(allImages[newIndex]);
  }

  // 다음 이미지
  const handleNextImage = () => {
    const newIndex = currentImageIndex < allImages.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setSelectedImage(allImages[newIndex]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1);
  };

  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
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

                  {/* 리뷰 이미지 클릭 */}
                  {review.images && review.images.length > 0 && (
                    <div className="review-images">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`리뷰 이미지 ${idx + 1}`}
                          onClick={() => handleImageClick(review.images, idx)}
                          style={{ cursor: 'pointer' }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="review-footer">
                  <span className="review-date">{formatDate(review.created_at)}</span>
                  <div className="review-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditReview(review)}
                    >
                      수정
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteReview(review.rid)}
                    >
                      삭제
                    </button>
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

      {isModalOpen && (
        <ReviewWriteModal
          orderItem={selectedItem}
          existingReview={editingReview}
          onClose={handleCloseModal}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* ✅ 이미지 확대 모달 */}
      {imageModalOpen && (
        <div className="image-modal-overlay" onClick={() => setImageModalOpen(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setImageModalOpen(false)}>
              ✕
            </button>

            {allImages.length > 1 && (
              <>
                <button className="image-nav-btn prev" onClick={handlePrevImage}>
                  ‹
                </button>
                <button className="image-nav-btn next" onClick={handleNextImage}>
                  ›
                </button>
              </>
            )}

            <img src={selectedImage} alt="리뷰 이미지 크게 보기" />

            {allImages.length > 1 && (
              <div className="image-counter">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}