import React, { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { supabase } from '@config/supabase';
import './ReviewWriteModal.css';

export default function ReviewWriteModal({ orderItem, onClose, onSuccess }) {
  const { user, userInfo } = useAuth();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // 별점 클릭
  const handleRatingClick = (value) => {
    setRating(value);
  };

  // 이미지 업로드
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    console.log('업로드할 파일:', files);
    // TODO: 이미지 미리보기 추가
  };

  // 리뷰 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('사용 후기를 작성해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('reviews')
        .insert({
          uid: user.id,
          oiid: orderItem.oiid,
          pid: orderItem.pid,
          rating: rating,
          title: content.substring(0, 50), // 내용의 일부를 제목으로
          content: content.trim(),
          images: images.length > 0 ? images : null,
          author_name: userInfo.name,
          author_nickname: userInfo.user_id,
          is_visible: true
        });

      if (error) throw error;

      alert('리뷰가 작성되었습니다!');
      onSuccess(); // 리뷰 작성 후 목록 새로고침
      onClose(); // 모달 닫기

    } catch (error) {
      console.error('리뷰 작성 실패:', error);
      alert('리뷰 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="modal-header">
          <h2>리뷰 작성</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 상품 정보 */}
        <div className="modal-product-info">
          <img 
            src={orderItem.products?.thumbnail_url} 
            alt={orderItem.product_name}
            className="product-thumbnail"
          />
          <div className="product-details">
            <p className="brand-name">
              {orderItem.product_brand || orderItem.products?.brands?.name}
            </p>
            <p className="product-name">
              {orderItem.product_name || orderItem.products?.name}
            </p>
          </div>
        </div>

        {/* 리뷰 폼 */}
        <form onSubmit={handleSubmit} className="review-modal-form">
          {/* 적립 마일리지 정보 */}
          <div className="review-point-info">
            <div className="point-conditions">
              <label>
                <input type="checkbox" disabled checked />
                50자 이상 작성
              </label>
              <label>
                <input type="checkbox" disabled />
                제품 사진 첨부
              </label>
            </div>
          </div>

          {/* 별점 */}
          <div className="form-group">
            <label className="required">상품은 어떠셨나요?</label>
            <p className="sub-label">별점을 매겨주세요</p>
            <div className="star-rating-large">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  {star <= (hoveredRating || rating) ? '★' : '☆'}
                </span>
              ))}
            </div>
          </div>

          {/* 사진 첨부 */}
          <div className="form-group">
            <label>상품 사진 또는 착용 사진을 올려주세요</label>
            <p className="sub-label">
              상품과 상관없는 사진 및 동영상을 첨부한 리뷰는 통보없이 삭제될 수 있습니다.
            </p>
            <div className="image-upload-area">
              <label htmlFor="image-upload" className="upload-box">
                <div className="upload-icon">+</div>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* 내용 */}
          <div className="form-group">
            <label className="required">사용 후기를 적어주세요</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="제품에 대해 만족스러웠던 점이나, 디자인·사용감·스타일링·사용 팁 등에 대해 남겨주세요."
              rows={6}
              maxLength={1000}
              required
            />
            <p className="char-count">{content.length}</p>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className="submit-review-btn"
          >
            {submitting ? '등록 중...' : '등록하기'}
          </button>
        </form>
      </div>
    </div>
  );
}