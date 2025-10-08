import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import Pagination from '../../components/common/Pagination';
import './OrderInquiries.css';

const OrderInquiries = () => {
  const navigate = useNavigate();
  const { user, userInfo } = useAuth();
  
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [answer, setAnswer] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const itemsPerPage = 10;
  
  // 일반 유저용 상태
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    type: 'PRODUCT',
    title: '',
    content: '',
    oid: null,
    pid: null
  });

  const isAdmin = userInfo?.role === 'admin';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!userInfo) return;
    
    loadInquiries();
  }, [user, userInfo, statusFilter, typeFilter, currentPage]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      
      // 카운트 쿼리
      let countQuery = supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true });

      if (!isAdmin) {
        countQuery = countQuery.eq('uid', user.id);
      }
      if (statusFilter !== 'ALL') {
        countQuery = countQuery.eq('status', statusFilter);
      }
      if (typeFilter !== 'ALL') {
        countQuery = countQuery.eq('type', typeFilter);
      }

      const { count } = await countQuery;
      setTotalInquiries(count || 0);
      
      // 데이터 쿼리
      const startIndex = (currentPage - 1) * itemsPerPage;
      
      let query = supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1);

      if (!isAdmin) {
        query = query.eq('uid', user.id);
      }
      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== 'ALL') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // 관리자인 경우 사용자 정보 가져오기
      if (isAdmin) {
        const inquiriesWithDetails = await Promise.all(
          data.map(async (inquiry) => {
            const { data: userInfo, error: userError } = await supabase
              .from('user_info')
              .select('name, email, user_id')
              .eq('id', inquiry.uid)
              .single();

            if (userError) console.error('사용자 정보 조회 오류:', userError);

            let orderInfo = null;
            if (inquiry.oid) {
              const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('oid, total_amount, created_at')
                .eq('oid', inquiry.oid)
                .maybeSingle();

              if (orderError) {
                console.error('주문 정보 조회 오류:', orderError);
              } else {
                orderInfo = orderData;
              }
            }

            return {
              ...inquiry,
              user_info: userInfo,
              orders: orderInfo
            };
          })
        );
        setInquiries(inquiriesWithDetails || []);
      } else {
        // 일반 유저인 경우 주문 정보만 가져오기
        const inquiriesWithOrders = await Promise.all(
          data.map(async (inquiry) => {
            let orderInfo = null;
            if (inquiry.oid) {
              const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('oid, total_amount, created_at')
                .eq('oid', inquiry.oid)
                .maybeSingle();

              if (orderError) {
                console.error('주문 정보 조회 오류:', orderError);
              } else {
                orderInfo = orderData;
              }
            }

            return {
              ...inquiry,
              orders: orderInfo
            };
          })
        );
        setInquiries(inquiriesWithOrders || []);
      }
    } catch (error) {
      console.error('문의 목록 로드 오류:', error);
      alert('문의 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // === 일반 유저 기능 ===
  const openWriteModal = () => {
    setFormData({
      type: 'PRODUCT',
      title: '',
      content: '',
      oid: null,
      pid: null
    });
    setIsEditing(false);
    setShowWriteModal(true);
  };

  const openEditModal = (inquiry) => {
    setFormData({
      type: inquiry.type,
      title: inquiry.title,
      content: inquiry.content,
      oid: inquiry.oid,
      pid: inquiry.pid
    });
    setSelectedInquiry(inquiry);
    setIsEditing(true);
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('inquiries')
          .update({
            type: formData.type,
            title: formData.title,
            content: formData.content,
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
            status: 'PENDING'
          });

        if (error) throw error;
        alert('문의가 등록되었습니다.');
      }

      setShowWriteModal(false);
      setSelectedInquiry(null);
      loadInquiries();
    } catch (error) {
      console.error('문의 등록/수정 오류:', error);
      alert('문의 등록/수정에 실패했습니다.');
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
      loadInquiries();
    } catch (error) {
      console.error('문의 삭제 오류:', error);
      alert('문의 삭제에 실패했습니다.');
    }
  };

  // === 관리자 기능 ===
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
      await loadInquiries();
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
      await loadInquiries();
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
      await loadInquiries();
    } catch (error) {
      console.error('환불 거부 오류:', error);
      alert('환불 거부에 실패했습니다.');
    }
  };

  // === 공통 함수 ===
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (type, value) => {
    if (type === 'status') {
      setStatusFilter(value);
    } else {
      setTypeFilter(value);
    }
    setCurrentPage(1);
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
      'PENDING': isAdmin ? '대기중' : '답변대기',
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

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  // === 관리자 뷰 ===
  if (isAdmin) {
    return (
      <div className="inquiries-container admin-view" id="inquiries">
        <div className="page-header">
          <h1>문의 관리</h1>
          
          <div className="filter-section">
            <select 
              value={typeFilter} 
              onChange={(e) => handleFilterChange('type', e.target.value)}
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
              onChange={(e) => handleFilterChange('status', e.target.value)}
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
          onPageChange={handlePageChange}
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
  }

  // === 일반 유저 뷰 ===
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
              <p className="card-preview">{inquiry.content}</p>
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

            <div className="modal-actions">
              <button onClick={handleSubmit} className="btn-submit">
                {isEditing ? '수정하기' : '등록하기'}
              </button>
              <button 
                onClick={() => {
                  setShowWriteModal(false);
                  setSelectedInquiry(null);
                }}
                className="btn-cancel"
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

export default OrderInquiries;