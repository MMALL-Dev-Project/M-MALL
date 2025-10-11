import React, { useState } from 'react';
import { supabase } from '../../config/supabase';
import Pagination from '../../components/common/Pagination';

const AdminInquiries = ({ 
  inquiries, 
  statusFilter,
  typeFilter,
  currentPage, 
  totalInquiries, 
  itemsPerPage, 
  onFilterChange,
  onPageChange, 
  onReload,
  userInfo
}) => {
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [answer, setAnswer] = useState('');

  const openAdminDetailModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setAnswer(inquiry.admin_answer || '');
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('inquiries')
        .update({
          admin_answer: answer,
          answered_by: userInfo.name,
          answered_at: new Date().toISOString(),
          status: 'ANSWERED',
          updated_at: new Date().toISOString()
        })
        .eq('iid', selectedInquiry.iid);

      if (error) throw error;

      alert('답변이 등록되었습니다.');
      setSelectedInquiry(null);
      setAnswer('');
      await onReload();
    } catch (error) {
      console.error('답변 등록 오류:', error);
      alert('답변 등록에 실패했습니다.');
    }
  };

  const approveRefund = async () => {
    if (!confirm('환불을 승인하시겠습니까?')) return;

    try {
      const { error: inquiryError } = await supabase
        .from('inquiries')
        .update({
          status: 'APPROVED',
          answered_by: userInfo.name,
          answered_at: new Date().toISOString(),
          admin_answer: answer || '환불이 승인되었습니다.',
          updated_at: new Date().toISOString()
        })
        .eq('iid', selectedInquiry.iid);

      if (inquiryError) throw inquiryError;

      if (selectedInquiry.oid) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            status: 'REFUNDED',
            updated_at: new Date().toISOString()
          })
          .eq('oid', selectedInquiry.oid);

        if (orderError) throw orderError;
      }

      alert('환불이 승인되었습니다.');
      setSelectedInquiry(null);
      setAnswer('');
      await onReload();
    } catch (error) {
      console.error('환불 승인 오류:', error);
      alert('환불 승인에 실패했습니다.');
    }
  };

  const rejectRefund = async () => {
    if (!answer.trim()) {
      alert('거부 사유를 입력해주세요.');
      return;
    }

    if (!confirm('환불을 거부하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('inquiries')
        .update({
          status: 'REJECTED',
          answered_by: userInfo.name,
          answered_at: new Date().toISOString(),
          admin_answer: answer,
          updated_at: new Date().toISOString()
        })
        .eq('iid', selectedInquiry.iid);

      if (error) throw error;

      alert('환불이 거부되었습니다.');
      setSelectedInquiry(null);
      setAnswer('');
      await onReload();
    } catch (error) {
      console.error('환불 거부 오류:', error);
      alert('환불 거부에 실패했습니다.');
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
      'PENDING': '대기중',
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
    <div className="inquiries-container admin-view" id="inquiries">
      <div className="page-header">
        <h1>문의 관리</h1>
        
        <div className="filter-section">
          <select 
            value={typeFilter} 
            onChange={(e) => onFilterChange('type', e.target.value)}
          >
            <option value="ALL">전체 유형</option>
            <option value="PRODUCT">상품문의</option>
            <option value="ORDER">주문문의</option>
            <option value="DELIVERY">배송문의</option>
            <option value="REFUND">환불요청</option>
            <option value="ETC">기타문의</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => onFilterChange('status', e.target.value)}
          >
            <option value="ALL">전체 상태</option>
            <option value="PENDING">대기중</option>
            <option value="ANSWERED">답변완료</option>
            <option value="APPROVED">승인완료</option>
            <option value="REJECTED">거부됨</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="inquiries-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>유형</th>
              <th>제목</th>
              <th>작성자</th>
              <th>구매여부</th>
              <th>첨부</th>
              <th>상태</th>
              <th>작성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry, index) => (
              <tr key={inquiry.iid}>
                <td>{totalInquiries - (currentPage - 1) * itemsPerPage - index}</td>
                <td>
                  <span className={`type-badge type-${inquiry.type.toLowerCase()}`}>
                    {getTypeText(inquiry.type)}
                  </span>
                </td>
                <td className="inquiry-title">{inquiry.title}</td>
                <td>
                  {inquiry.user_info?.name}<br/>
                  <span className="user-email">({inquiry.user_info?.email})</span>
                </td>
                <td>
                  {inquiry.oid ? (
                    <span className="purchase-badge purchased">구매</span>
                  ) : (
                    <span className="purchase-badge non-purchased">비구매</span>
                  )}
                </td>
                <td>
                  {inquiry.images && inquiry.images.length > 0 ? (
                    <span className="image-count">{inquiry.images.length}</span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <span className={`status-badge status-${inquiry.status.toLowerCase()}`}>
                    {getStatusText(inquiry.status)}
                  </span>
                </td>
                <td>{formatDate(inquiry.created_at)}</td>
                <td>
                  <button 
                    onClick={() => openAdminDetailModal(inquiry)}
                    className="btn btn-detail"
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalInquiries / itemsPerPage)}
        onPageChange={onPageChange}
        totalItems={totalInquiries}
        itemsPerPage={itemsPerPage}
      />

      {inquiries.length === 0 && (
        <div className="empty-state">문의가 없습니다.</div>
      )}

      {/* 관리자 상세 모달 */}
      {selectedInquiry && (
        <div className="modal-overlay" onClick={() => setSelectedInquiry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>문의 상세</h2>
            
            <div className="detail-section">
              <div className="detail-row">
                <span className="label">유형:</span>
                <span className="value">{getTypeText(selectedInquiry.type)}</span>
              </div>
              <div className="detail-row">
                <span className="label">작성자:</span>
                <span className="value">{selectedInquiry.user_info?.name} ({selectedInquiry.user_info?.email})</span>
              </div>
              <div className="detail-row">
                <span className="label">구매여부:</span>
                <span className="value">
                  {selectedInquiry.oid ? (
                    <>구매 (주문번호: {selectedInquiry.oid})</>
                  ) : (
                    '비구매'
                  )}
                </span>
              </div>
              {selectedInquiry.orders && (
                <div className="detail-row">
                  <span className="label">주문금액:</span>
                  <span className="value">{selectedInquiry.orders.total_amount?.toLocaleString()}원</span>
                </div>
              )}
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
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {selectedInquiry.admin_answer && (
              <div className="answer-section">
                <h3>답변</h3>
                <p className="content-text">{selectedInquiry.admin_answer}</p>
                <div className="answer-info">
                  답변자: {selectedInquiry.answered_by} | {formatDate(selectedInquiry.answered_at)}
                </div>
              </div>
            )}

            {selectedInquiry.status === 'PENDING' && (
              <>
                <div className="form-group">
                  <label>답변 작성</label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="답변을 입력해주세요"
                    rows="6"
                  />
                </div>

                <div className="modal-actions">
                  {selectedInquiry.type === 'REFUND' ? (
                    <>
                      <button onClick={approveRefund} className="btn btn-approve">
                        환불 승인
                      </button>
                      <button onClick={rejectRefund} className="btn btn-reject">
                        환불 거부
                      </button>
                    </>
                  ) : (
                    <button onClick={submitAnswer} className="btn btn-primary">
                      답변 등록
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedInquiry(null);
                      setAnswer('');
                    }}
                    className="btn btn-secondary"
                  >
                    닫기
                  </button>
                </div>
              </>
            )}

            {selectedInquiry.status !== 'PENDING' && (
              <div className="modal-actions">
                <button 
                  onClick={() => setSelectedInquiry(null)}
                  className="btn btn-secondary"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInquiries;