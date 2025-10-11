import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import Pagination from '../../components/common/Pagination';

const UserInquiries = ({ 
  inquiries, 
  currentPage, 
  totalInquiries, 
  itemsPerPage, 
  onPageChange, 
  onReload,
  user,
  location
}) => {
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    type: 'PRODUCT',
    title: '',
    content: '',
    oid: null,
    pid: null,
    images: []
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [productInfo, setProductInfo] = useState(null);

  // 다른 페이지에서 상품 정보와 함께 넘어온 경우
  useEffect(() => {
    if (location.state?.productInfo) {
      setProductInfo(location.state.productInfo);
      setFormData({
        type: 'PRODUCT',
        title: '',
        content: '',
        oid: null,
        pid: location.state.productInfo.pid,
        images: []
      });
      setShowWriteModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const uploadImages = async (files) => {
    const uploadedUrls = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name}의 크기가 5MB를 초과합니다.`);
        continue;
      }

      const { data, error: uploadError } = await supabase.storage
        .from('inquiries')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('이미지 업로드 오류:', uploadError);
        alert(`${file.name} 업로드 실패: ${uploadError.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('inquiries')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    if (uploadedUrls.length === 0) {
      throw new Error('업로드된 이미지가 없습니다.');
    }

    return uploadedUrls;
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + previewImages.length > 5) {
      alert('이미지는 최대 5개까지 첨부할 수 있습니다.');
      return;
    }

    const newPreviews = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setPreviewImages([...previewImages, ...newPreviews]);
  };

  const removePreviewImage = (index) => {
    const newPreviews = [...previewImages];
    URL.revokeObjectURL(newPreviews[index].url);
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

  const removeExistingImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const openWriteModal = () => {
    setFormData({
      type: 'PRODUCT',
      title: '',
      content: '',
      oid: null,
      pid: null,
      images: []
    });
    setPreviewImages([]);
    setIsEditing(false);
    setShowWriteModal(true);
  };

  const openEditModal = (inquiry) => {
    setFormData({
      type: inquiry.type,
      title: inquiry.title,
      content: inquiry.content,
      oid: inquiry.oid,
      pid: inquiry.pid,
      images: inquiry.images || []
    });
    setPreviewImages([]);
    // 수정 시에는 iid만 저장 (모달 중복 방지)
    setSelectedInquiry({ iid: inquiry.iid });
    setIsEditing(true);
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setUploadingImages(true);

      let uploadedImageUrls = [];
      if (previewImages.length > 0) {
        const files = previewImages.map(preview => preview.file);
        uploadedImageUrls = await uploadImages(files);
      }

      const allImages = [...formData.images, ...uploadedImageUrls];

      if (isEditing) {
        const { error } = await supabase
          .from('inquiries')
          .update({
            type: formData.type,
            title: formData.title,
            content: formData.content,
            images: allImages.length > 0 ? allImages : null,
            updated_at: new Date().toISOString()
          })
          .eq('iid', selectedInquiry.iid);

        if (error) throw error;
        alert('문의가 수정되었습니다.');
      } else {
        const { error } = await supabase
          .from('inquiries')
          .insert({
            uid: user.id,
            type: formData.type,
            title: formData.title,
            content: formData.content,
            oid: formData.oid,
            pid: formData.pid,
            images: allImages.length > 0 ? allImages : null,
            status: 'PENDING'
          });

        if (error) throw error;
        alert('문의가 등록되었습니다.');
      }

      setShowWriteModal(false);
      setPreviewImages([]);
      setSelectedInquiry(null);
      setIsEditing(false);
      await onReload();
    } catch (error) {
      console.error('문의 등록/수정 오류:', error);
      alert('문의 등록/수정에 실패했습니다.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDelete = async (inquiryId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('iid', inquiryId);

      if (error) throw error;

      alert('문의가 삭제되었습니다.');
      onReload();
    } catch (error) {
      console.error('문의 삭제 오류:', error);
      alert('문의 삭제에 실패했습니다.');
    }
  };

  const getTypeText = (type) => {
    const typeMap = {
      'PRODUCT': '상품문의',
      'ORDER': '주문문의',
      'DELIVERY': '배송문의',
      'REFUND': '환불요청',
      'ETC': '기타문의'
    };
    return typeMap[type] || type;
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': '답변대기',
      'ANSWERED': '답변완료',
      'APPROVED': '승인완료',
      'REJECTED': '거부됨'
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="inquiries-container user-view" id="inquiries">
      <div className="page-header">
        <h1>내 문의 내역</h1>
        <button onClick={openWriteModal} className="btn-write">
          문의하기
        </button>
      </div>

      <div className="user-list">
        {inquiries.map((inquiry) => (
          <div key={inquiry.iid} className="inquiry-card">
            <div className="card-header">
              <div className="card-meta">
                <span className={`status-badge status-${inquiry.status.toLowerCase()}`}>
                  {getStatusText(inquiry.status)}
                </span>
                <span className={`type-badge type-${inquiry.type.toLowerCase()}`}>
                  {getTypeText(inquiry.type)}
                </span>
                {inquiry.oid ? (
                  <span className="purchase-badge purchased">구매</span>
                ) : (
                  <span className="purchase-badge non-purchased">비구매</span>
                )}
              </div>
              <span className="card-date">{formatDate(inquiry.created_at)}</span>
            </div>

            <div className="card-content">
              <h3 
                className="card-title" 
                onClick={() => setSelectedInquiry(inquiry)}
              >
                {inquiry.title}
              </h3>
              
              {inquiry.product_info && (
                <div className="product-info-in-card">
                  <img 
                    src={inquiry.product_info.thumbnail} 
                    alt={inquiry.product_info.name}
                    className="order-thumbnail"
                  />
                  <div className="order-details">
                    <div className="order-name">{inquiry.product_info.name}</div>
                    {inquiry.product_info.brand && (
                      <div className="order-brand">{inquiry.product_info.brand}</div>
                    )}
                  </div>
                </div>
              )}
              
              <p className="card-preview">{inquiry.content}</p>
              
              {inquiry.images && inquiry.images.length > 0 && (
                <div className="card-images">
                  {inquiry.images.slice(0, 3).map((imageUrl, index) => (
                    <img 
                      key={index}
                      src={imageUrl} 
                      alt={`첨부 이미지 ${index + 1}`}
                      className="card-thumbnail"
                      onClick={() => setSelectedInquiry(inquiry)}
                    />
                  ))}
                  {inquiry.images.length > 3 && (
                    <div className="more-images">
                      +{inquiry.images.length - 3}
                    </div>
                  )}
                </div>
              )}
              
              {inquiry.orders && (
                <div className="card-amount">
                  총 결제금액: {inquiry.orders.total_amount?.toLocaleString()}원
                </div>
              )}
            </div>

            {inquiry.status === 'PENDING' && (
              <div className="card-actions">
                <button 
                  onClick={() => openEditModal(inquiry)}
                  className="btn-edit"
                >
                  수정
                </button>
                <button 
                  onClick={() => handleDelete(inquiry.iid)}
                  className="btn-delete"
                >
                  삭제
                </button>
              </div>
            )}

            {inquiry.admin_answer && (
              <div className="admin-answer-preview">
                <strong>관리자 답변:</strong> {inquiry.admin_answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalInquiries / itemsPerPage)}
        onPageChange={onPageChange}
        totalItems={totalInquiries}
        itemsPerPage={itemsPerPage}
      />

      {inquiries.length === 0 && (
        <div className="empty-state">
          <p>작성한 문의가 없습니다.</p>
          <button onClick={openWriteModal} className="btn-write">
            첫 문의 작성하기
          </button>
        </div>
      )}

      {/* 작성/수정 모달 */}
      {showWriteModal && (
        <div className="modal-overlay" onClick={() => setShowWriteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{isEditing ? '문의 수정' : '새 문의 작성'}</h2>

            {productInfo && formData.pid && (
              <div className="order-info-detail">
                <img 
                  src={productInfo.thumbnail} 
                  alt={productInfo.name}
                  className="order-detail-image"
                />
                <div className="order-detail-text">
                  <div className="order-detail-name">{productInfo.name}</div>
                  {productInfo.brand && (
                    <div className="order-detail-brand">{productInfo.brand}</div>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>문의 유형</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="PRODUCT">상품문의</option>
                <option value="ORDER">주문문의</option>
                <option value="DELIVERY">배송문의</option>
                <option value="REFUND">환불요청</option>
                <option value="ETC">기타문의</option>
              </select>
            </div>

            <div className="form-group">
              <label>제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="제목을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="문의 내용을 입력하세요"
                rows="10"
              />
            </div>

            <div className="form-group">
              <label>
                이미지 첨부 
                <span className="image-limit">(최대 5개, JPG/PNG/GIF, 각 5MB 이하)</span>
              </label>
              
              {isEditing && formData.images.length > 0 && (
                <div className="existing-images">
                  <p className="image-section-title">기존 이미지</p>
                  <div className="image-preview-grid">
                    {formData.images.map((imageUrl, index) => (
                      <div key={`existing-${index}`} className="image-preview-item">
                        <img src={imageUrl} alt={`기존 이미지 ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="remove-image-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewImages.length > 0 && (
                <div className="preview-images">
                  <p className="image-section-title">새로 추가할 이미지</p>
                  <div className="image-preview-grid">
                    {previewImages.map((preview, index) => (
                      <div key={`preview-${index}`} className="image-preview-item">
                        <img src={preview.url} alt={`미리보기 ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removePreviewImage(index)}
                          className="remove-image-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(formData.images.length + previewImages.length) < 5 && (
                <div className="image-upload-box">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/jpeg,image/png,image/gif"
                    multiple
                    onChange={handleImageSelect}
                    className="image-input"
                  />
                  <label htmlFor="image-upload" className="image-upload-label">
                    <span>이미지 선택 ({formData.images.length + previewImages.length}/5)</span>
                  </label>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                onClick={handleSubmit} 
                className="btn-submit"
                disabled={uploadingImages}
              >
                {uploadingImages ? '업로드 중...' : (isEditing ? '수정하기' : '등록하기')}
              </button>
              <button 
                onClick={() => {
                  setShowWriteModal(false);
                  setSelectedInquiry(null);
                  setPreviewImages([]);
                }}
                className="btn-cancel"
                disabled={uploadingImages}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일반 유저 상세보기 모달 */}
      {selectedInquiry && !showWriteModal && (
        <div className="modal-overlay" onClick={() => setSelectedInquiry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>문의 상세</h2>

            {selectedInquiry.product_info && (
              <div className="order-info-detail">
                <img 
                  src={selectedInquiry.product_info.thumbnail} 
                  alt={selectedInquiry.product_info.name}
                  className="order-detail-image"
                />
                <div className="order-detail-text">
                  <div className="order-detail-name">{selectedInquiry.product_info.name}</div>
                  {selectedInquiry.product_info.brand && (
                    <div className="order-detail-brand">{selectedInquiry.product_info.brand}</div>
                  )}
                </div>
              </div>
            )}

            <div className="detail-section">
              <div className="detail-row">
                <span className="label">작성일:</span>
                <span className="value">{formatDate(selectedInquiry.created_at)}</span>
              </div>
            </div>

            <div className="content-section">
              <h3>제목</h3>
              <p>{selectedInquiry.title}</p>

              <h3>내용</h3>
              <p className="content-text">{selectedInquiry.content}</p>

              {selectedInquiry.images && selectedInquiry.images.length > 0 && (
                <>
                  <h3>첨부 이미지</h3>
                  <div className="image-gallery">
                    {selectedInquiry.images.map((imageUrl, index) => (
                      <img 
                        key={index}
                        src={imageUrl} 
                        alt={`문의 이미지 ${index + 1}`}
                        className="inquiry-image"
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {selectedInquiry.orders && (
                <div className="order-total-amount">
                  <strong>총 결제금액:</strong> {selectedInquiry.orders.total_amount?.toLocaleString()}원
                </div>
              )}
            </div>

            {selectedInquiry.admin_answer && (
              <div className="answer-section answered">
                <h3>관리자 답변</h3>
                <p className="content-text">{selectedInquiry.admin_answer}</p>
                <div className="answer-info">
                  답변일: {formatDate(selectedInquiry.answered_at)}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => setSelectedInquiry(null)} className="btn-cancel">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInquiries;