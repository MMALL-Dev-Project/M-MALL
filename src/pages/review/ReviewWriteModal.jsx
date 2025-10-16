import React, { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { supabase } from '@config/supabase';
import './ReviewWriteModal.css';

export default function ReviewWriteModal({ orderItem, existingReview, onClose, onSuccess }) {
  const { user, userInfo } = useAuth();

  const isEditMode = !!existingReview;

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 0);
      setContent(existingReview.content || '');
      setImages(existingReview.images || []);
    }
  }, [existingReview]);

  const productInfo = isEditMode
    ? existingReview.products // 수정 모드: existingReview
    : orderItem?.products; // 작성 모드: orderItem

  const productName = isEditMode
    ? existingReview.products?.name
    : (orderItem?.product_name || orderItem?.products?.name);

  const brandName = isEditMode
    ? existingReview.products?.brands?.name
    : (orderItem?.product_brand || orderItem?.products?.brands?.name);

  const thumbnailUrl = productInfo?.thumbnail_url;

  // 별점 클릭
  const handleRatingClick = (value) => {
    setRating(value);
  };

  // 이미지 업로드
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    if (images.length + files.length > 5) {
      alert('이미지는 최대 5개까지만 업로드 가능합니다.');
      return;
    }

    try {
      setUploading(true);
      const uploadedUrls = [];

      for (const file of files) {
        // 파일 크기 체크
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name}은(는) 5MB를 초과하여 업로드할 수 없습니다.`);
          continue;
        }

        // 파일명 생성 (중복 방지)
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        // storage에 업로드
        const { data, error } = await supabase.storage
          .from('reviews')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        if (error) throw error;

        // public url 가져오기
        const { data: { publicUrl } } = supabase.storage
          .from('reviews')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // 기존 이미지 + 새 이미지
      setImages([...images, ...uploadedUrls]);

      if (uploadedUrls.length > 0) {
        alert(`${uploadedUrls.length}개의 이미지가 업로드되었습니다!`);
      }

    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 이미지 삭제
  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
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

      if (isEditMode) {
        // UPDATE
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: rating,
            title: content.substring(0, 50),
            content: content.trim(),
            images: images.length > 0 ? images : null,
            updated_at: new Date().toISOString()
          })
          .eq('rid', existingReview.rid)
          .eq('uid', user.id); // 본인 리뷰만 수정 가능

        if (error) throw error;
        alert('리뷰가 수정되었습니다!');

      } else {
        // INSERT
        const { error } = await supabase
          .from('reviews')
          .insert({
            uid: user.id,
            oiid: orderItem.oiid,
            pid: orderItem.pid,
            rating: rating,
            title: content.substring(0, 50), // 글 앞부분을 제목으로
            content: content.trim(),
            images: images.length > 0 ? images : null,
            author_name: userInfo.name,
            author_nickname: userInfo.user_id,
            is_visible: true
          });

        if (error) throw error;
        alert('리뷰가 작성되었습니다!');
      }

      onSuccess(); // 리뷰 목록 새로고침
      onClose(); // 모달 닫기

    } catch (error) {
      console.error('리뷰 작성/수정 실패:', error);
      alert(isEditMode ? '리뷰 수정에 실패했습니다.' : '리뷰 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="modal-header">
          <h2>{isEditMode ? '리뷰 수정' : '리뷰 작성'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 상품 정보 */}
        <div className="modal-product-info">
          <img
            src={thumbnailUrl}
            alt={productName}
            className="product-thumbnail"
          />
          <div className="product-details">
            <p className="brand-name">{brandName} </p>
            <p className="product-name">{productName}</p>
          </div>
        </div>

        {/* 리뷰 폼 */}
        <form onSubmit={handleSubmit} className="review-modal-form">
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
            <label>상품 사진 또는 착용 사진을 올려주세요.</label>
            <p className="sub-label">
              상품과 상관없는 사진 및 동영상을 첨부한 리뷰는 통보없이 삭제될 수 있습니다.
            </p>
            <div className="image-upload-area">
              {/* 업로드된 이미지 미리보기 */}
              {images.map((url, index) => (
                <div key={index} className="uploaded-image">
                  <img src={url} alt={`업로드 이미지 ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => handleRemoveImage(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* 5개 미만일 때만 업로드 버튼 표시 */}
              {images.length < 5 && (
                <label htmlFor="image-upload" className="upload-box">
                  {uploading ? (
                    <div className="upload-icon">⏳</div>
                  ) : (
                    <>
                      <div className="upload-icon">+</div>
                      <p>{images.length}/5</p>
                    </>
                  )}
                </label>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={uploading || images.length >= 5}
              />
              {/* <label htmlFor="image-upload" className="upload-box">
                <div className="upload-icon">+</div>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              /> */}
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
            {submitting
              ? (isEditMode ? '수정 중...' : '등록 중...')
              : (isEditMode ? '수정하기' : '등록하기')
            }
          </button>
        </form>
      </div>
    </div>
  );
}