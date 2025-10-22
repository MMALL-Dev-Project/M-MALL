import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import Pagination from '../../components/common/Pagination';
import './OrderList.css';

const OrderList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 5;

  // 모달 상태
  const [cancelModal, setCancelModal] = useState(null);
  const [refundModal, setRefundModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDetail, setCancelDetail] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundDetail, setRefundDetail] = useState('');

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadOrders();
  }, [user, statusFilter, currentPage]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      let countQuery = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('uid', user.id);

      if (statusFilter !== 'ALL') {
        countQuery = countQuery.eq('status', statusFilter);
      }

      const { count } = await countQuery;
      setTotalOrders(count || 0);

      const startIndex = (currentPage - 1) * itemsPerPage;

      let ordersQuery = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              thumbnail_url,
              brands (name)
            )
          )
        `)
        .eq('uid', user.id)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1);

      if (statusFilter !== 'ALL') {
        ordersQuery = ordersQuery.eq('status', statusFilter);
      }

      const { data: ordersData, error: ordersError } = await ordersQuery;

      if (ordersError) throw ordersError;

      const ordersWithAddress = await Promise.all(
        ordersData.map(async (order) => {
          let addressInfo = null;
          if (order.address_id) {
            const { data: addressData, error: addressError } = await supabase
              .from('user_addresses')
              .select('recipient_name, recipient_phone, address, detail_address, postal_code')
              .eq('aid', order.address_id)
              .maybeSingle();

            if (addressError) {
              console.error('주소 정보 조회 오류:', addressError);
            } else {
              addressInfo = addressData;
            }
          }

          // 환불 요청 여부 확인
          let hasRefundRequest = false;
          const { data: inquiryData, error: inquiryError } = await supabase
            .from('inquiries')
            .select('iid')
            .eq('oid', order.oid)
            .eq('type', 'REFUND')
            .maybeSingle();

          if (!inquiryError && inquiryData) {
            hasRefundRequest = true;
          }

          return {
            ...order,
            user_addresses: addressInfo,
            has_refund_request: hasRefundRequest
          };
        })
      );

      setOrders(ordersWithAddress || []);
    } catch (error) {
      console.error('주문 목록 로드 오류:', error);
      alert('주문 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': '주문접수',
      'CONFIRMED': '주문확인',
      'PREPARING': '상품준비중',
      'SHIPPED': '배송중',
      'DELIVERED': '배송완료',
      'CANCELLED': '주문취소'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'PENDING': 'pending',
      'CONFIRMED': 'confirmed',
      'PREPARING': 'preparing',
      'SHIPPED': 'shipped',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled'
    };
    return colorMap[status] || 'pending';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 주문 취소 실행
  const submitCancel = async () => {
    if (!cancelReason) {
      alert('취소 사유를 선택해주세요.');
      return;
    }
    if (!cancelDetail.trim()) {
      alert('상세 사유를 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'CANCELLED',
          updated_at: new Date().toISOString()
        })
        .eq('oid', cancelModal.oid)
        .eq('uid', user.id);

      if (error) throw error;

      alert('주문이 취소되었습니다.');
      setCancelModal(null);
      setCancelReason('');
      setCancelDetail('');
      loadOrders();
    } catch (error) {
      console.error('주문 취소 오류:', error);
      alert('주문 취소에 실패했습니다.');
    }
  };

  // 환불 요청 실행
const submitRefund = async () => {
  if (!refundReason) {
    alert('환불 사유를 선택해주세요.');
    return;
  }
  if (!refundDetail.trim()) {
    alert('상세 사유를 입력해주세요.');
    return;
  }

  try {
    const { error } = await supabase
      .from('inquiries')
      .insert({
        uid: user.id,
        oid: refundModal.oid,
        type: 'REFUND',
        title: `환불 요청 - ${refundReason}`,
        content: refundDetail,
        status: 'PENDING'
      });

    if (error) throw error;

    alert('환불 요청이 접수되었습니다.\n문의 내역에서 확인하실 수 있습니다.');
    setRefundModal(null);
    setRefundReason('');
    setRefundDetail('');
    loadOrders();
  } catch (error) {
    console.error('환불 요청 오류:', error);
    alert('환불 요청에 실패했습니다.');
  }
};

  if (loading) {
    return (
      <div className="orders-loading">
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div id="orderList" className="orders-container">
      <div className="orders-header">
        <div className="container">
          <h1 className="orders-title">주문 내역</h1>

          <div className="filter-section">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="status-filter"
            >
              <option value="ALL">전체 주문</option>
              <option value="PENDING">주문접수</option>
              <option value="CONFIRMED">주문확인</option>
              <option value="PREPARING">상품준비중</option>
              <option value="SHIPPED">배송중</option>
              <option value="DELIVERED">배송완료</option>
              <option value="CANCELLED">주문취소</option>
            </select>
          </div>
        </div>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.oid} className="order-card">
            <div className="order-header">
              <div className="order-info">
                <div className="order-orderlist-number">
                  주문번호: {order.oid.toString().padStart(10, '0')}
                </div>
                <div className="order-date">
                  주문일시: {formatDate(order.created_at)}
                </div>
              </div>
              <div className="order-orderlist-status">
                <span className={`status-badge status-${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>

            <div className="order-items-section">
              <h4>주문 상품</h4>
              {order.order_items?.map((item, index) => (
                <div key={index} className="order-item">
                  <img
                    src={item.products?.thumbnail_url || '/default-product.png'}
                    alt={item.product_name}
                    className="item-image"
                  />
                  <div className="item-details">
                    <div className="item-name">{item.product_name}</div>
                    {item.products?.brands?.name && (
                      <div className="item-brand">{item.products.brands.name}</div>
                    )}
                    <div className="item-meta">
                      수량: {item.quantity}개 |
                      가격: {(item.unit_sale_price * item.quantity).toLocaleString()}원
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="address-section">
              <h4>배송지</h4>
              {order.user_addresses ? (
                <div className="address-info">
                  <div>{order.user_addresses.recipient_name} | {order.user_addresses.recipient_phone}</div>
                  <div>
                    [{order.user_addresses.postal_code}] {order.user_addresses.address} {order.user_addresses.detail_address}
                  </div>
                </div>
              ) : (
                <div className="no-address">배송지 정보 없음</div>
              )}
            </div>

            {order.tracking_number && (
              <div className="shipping-section">
                <h4>배송 정보</h4>
                <div className="shipping-info">
                  <div>택배사: {order.shipping_company}</div>
                  <div>송장번호: {order.tracking_number}</div>
                  {order.shipped_at && (
                    <div>배송시작일: {formatDate(order.shipped_at)}</div>
                  )}
                  {order.delivered_at && (
                    <div>배송완료일: {formatDate(order.delivered_at)}</div>
                  )}
                </div>
              </div>
            )}

            <div className="order-actions">
              <div className="action-buttons">
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => setCancelModal(order)}
                    className="btn btn-cancel"
                  >
                    주문 취소
                  </button>
                )}

                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => window.open(`https://tracker.delivery/#/ko/${order.shipping_company}/${order.tracking_number}`, '_blank')}
                    className="btn btn-track"
                  >
                    배송 조회
                  </button>
                )}

                {order.status === 'DELIVERED' && (
                  <>
                    {!order.has_refund_request ? (
                      <button
                        onClick={() => setRefundModal(order)}
                        className="btn btn-refund"
                      >
                        환불 요청
                      </button>
                    ) : (
                      <button
                        disabled
                        className="btn btn-refund-disabled"
                      >
                        환불 요청됨
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/review/write/?oid=${order.oid}`)}
                      className="btn btn-review"
                    > 
                      리뷰 작성
                    </button>
                  </>
                )}
              </div>

              <div className="total-amount">
                <span className="amount-label">총 결제금액</span>
                <span className="amount-value">{order.total_amount?.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalOrders / itemsPerPage)}
        onPageChange={handlePageChange}
        totalItems={totalOrders}
        itemsPerPage={itemsPerPage}
      />

      {orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-message">
            {statusFilter === 'ALL' ? '주문 내역이 없습니다.' : `${getStatusText(statusFilter)} 상태의 주문이 없습니다.`}
          </div>
          <button
            onClick={() => navigate('/products')}
            className="btn btn-shop"
          >
            쇼핑하러 가기
          </button>
        </div>
      )}

      {/* 취소 모달 */}
      {cancelModal && (
        <div className="modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">주문 취소</h3>

            <div className="modal-order-info">
              <div className="order-item">
                {cancelModal.order_items?.[0] && (
                  <>
                    <img
                      src={cancelModal.order_items[0].products?.thumbnail_url || '/default-product.png'}
                      alt={cancelModal.order_items[0].product_name}
                      className="item-image"
                    />
                    <div className="item-details">
                      <div className="item-name">{cancelModal.order_items[0].product_name}</div>
                      {cancelModal.order_items.length > 1 && (
                        <div className="item-meta">외 {cancelModal.order_items.length - 1}개</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">취소 사유</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="form-select"
              >
                <option value="">사유를 선택해주세요</option>
                <option value="단순 변심">단순 변심</option>
                <option value="상품 정보 상이">상품 정보 상이</option>
                <option value="배송 지연">배송 지연</option>
                <option value="다른 상품 잘못 주문">다른 상품 잘못 주문</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">상세 사유를 입력해주세요</label>
              <textarea
                value={cancelDetail}
                onChange={(e) => setCancelDetail(e.target.value)}
                placeholder="사유를 입력해주세요"
                className="form-textarea"
                rows="5"
              />
            </div>

            <div className="cancel-info">
              <h4>취소 / 환불 정보</h4>
              <div className="info-row">
                <span>총 결제금액</span>
                <span>{cancelModal.total_amount?.toLocaleString()}원</span>
              </div>
              <div className="info-row">
                <span>환불 수단</span>
                <span>네이버페이</span>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={submitCancel} className="btn btn-primary">
                취소접수
              </button>
              <button
                onClick={() => {
                  setCancelModal(null);
                  setCancelReason('');
                  setCancelDetail('');
                }}
                className="btn btn-secondary"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 환불 모달 */}
      {refundModal && (
        <div className="modal-overlay" onClick={() => setRefundModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">환불 요청</h3>

            <div className="modal-order-info">
              <div className="order-item">
                {refundModal.order_items?.[0] && (
                  <>
                    <img
                      src={refundModal.order_items[0].products?.thumbnail_url || '/default-product.png'}
                      alt={refundModal.order_items[0].product_name}
                      className="item-image"
                    />
                    <div className="item-details">
                      <div className="item-name">{refundModal.order_items[0].product_name}</div>
                      {refundModal.order_items.length > 1 && (
                        <div className="item-meta">외 {refundModal.order_items.length - 1}개</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">환불 사유</label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="form-select"
              >
                <option value="">사유를 선택해주세요</option>
                <option value="단순 변심">단순 변심</option>
                <option value="상품 불량">상품 불량</option>
                <option value="상품 파손">상품 파손</option>
                <option value="상품 정보 상이">상품 정보 상이</option>
                <option value="배송 오류">배송 오류</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">상세 사유를 입력해주세요</label>
              <textarea
                value={refundDetail}
                onChange={(e) => setRefundDetail(e.target.value)}
                placeholder="사유를 입력해주세요"
                className="form-textarea"
                rows="5"
              />
            </div>

            <div className="cancel-info">
              <h4>취소 / 환불 정보</h4>
              <div className="info-row">
                <span>총 결제금액</span>
                <span>{refundModal.total_amount?.toLocaleString()}원</span>
              </div>
              <div className="info-row">
                <span>환불 수단</span>
                <span>네이버페이</span>
              </div>
            </div>

            <div className="refund-notice">
              <h4>환불 안내</h4>
              <ul>
                <li>환불 요청이 승인되면 3-5일 이내에 환불이 완료됩니다.</li>
                <li>카드 결제의 경우 카드사 사정에 따라 환불이 지연될 수 있습니다.</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button onClick={submitRefund} className="btn btn-primary">
                환불접수
              </button>
              <button
                onClick={() => {
                  setRefundModal(null);
                  setRefundReason('');
                  setRefundDetail('');
                }}
                className="btn btn-secondary"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;