import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewWriteModal from '@pages/review/ReviewWriteModal';
import './OrderHistory.css';
import { supabase } from '@/config/supabase';

export default function OrderHistory({ orderStats, recentOrders, onRefresh }) {
  const navigate = useNavigate();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [reviewStatuses, setReviewStatuses] = useState({});

  // 리뷰 작성 여부 확인
  const checkReviewStatuses = async () => {
    try {
      // recentOrders 모든 oild 추출
      const allOiids = recentOrders.flatMap(order =>
        order.order_items?.map(item => item.oiid) || []
      );
      // oild 없으면 함수 종료
      if (allOiids.length === 0) return;

      // 테이블 조회
      const { data, error } = await supabase
        .from('reviews')
        .select('oiid')
        .in('oiid', allOiids); // allOiids 배열에 포함된 oiid만 조회

      if (error) throw error;

      const reviewedOiids = new Set(data?.map(review => review.oiid) || []);

      const statuses = {};
      allOiids.forEach(oiid => {
        statuses[oiid] = reviewedOiids.has(oiid);
      });

      setReviewStatuses(statuses);
    } catch (error) {
      console.error('리뷰 상태 확인 중 오류:', error);
    }
  }

  useEffect(() => {
    if (recentOrders.length > 0) {
      checkReviewStatuses();
    }
  }, [recentOrders]);

  const handleReviewSuccess = () => {
    checkReviewStatuses(); // 리뷰 상태 다시 확인
    onRefresh(); // 주문 목록 새로고침
  };

  // 리뷰 작성 버튼
  const handleWriteReview = (item) => {
    setSelectedOrderItem(item);
    setReviewModalOpen(true);
  }

  // 리뷰 보기 버튼
  const handleViewReview = () => {
    navigate('/mypage', { 
      state: { 
        activeMenu: '상품리뷰',
        activeTab: 'written' 
      } 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1);
  };

  const formatPrice = (price) => {
    return price?.toLocaleString('ko-KR') + '원';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': '입금대기',
      'PAID': '결제완료',
      'CONFIRMED': '주문확인',
      'PREPARING': '상품준비중',
      'SHIPPED': '배송중',
      'DELIVERED': '배송완료',
      'CANCELLED': '주문취소',
      'EXCHANGED': '교환',
      'RETURNED': '반품'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="order-history-container">
      <div className="content-header">
        <h2>주문 내역 (최근 1개월)</h2>
        <button className="more-btn" onClick={() => navigate('/order/orderList')}>
          전체보기 ›
        </button>
      </div>

      {/* 주문 상태별 개수 */}
      <div className="order-status-box">
        <div className="order-status-grid">
          <div className="status-item">
            <p className="status-count">{orderStats.pending}</p>
            <p className="status-label">입금대기</p>
          </div>
          <div className="status-item">
            <p className="status-count">{orderStats.paid}</p>
            <p className="status-label">결제완료</p>
          </div>
          <div className="status-item">
            <p className="status-count">{orderStats.preparing}</p>
            <p className="status-label">상품준비중</p>
          </div>
          <div className="status-item">
            <p className="status-count">{orderStats.shipping}</p>
            <p className="status-label">배송중</p>
          </div>
          <div className="status-item">
            <p className="status-count">{orderStats.delivered}</p>
            <p className="status-label">배송완료</p>
          </div>
        </div>
        <div className="order-actions">
          <div className="action-item">
            <span>취소</span>
            <span className="action-count">{orderStats.cancelled}</span>
          </div>
          <div className="action-item">
            <span>교환</span>
            <span className="action-count">{orderStats.exchanged}</span>
          </div>
          <div className="action-item">
            <span>반품</span>
            <span className="action-count">{orderStats.returned}</span>
          </div>
        </div>
      </div>

      {/* 최근 주문 목록 */}
      {recentOrders.length > 0 ? (
        recentOrders.map(order => (
          <div key={order.oid} className="order-item">
            <div className="order-header">
              <div>
                <span className="order-date">{formatDate(order.created_at)}</span>
                <span className="order-number">OD{order.oid}</span>
              </div>
              <button
                className="detail-btn"
                onClick={() => navigate(`/order/orderdetail/${order.oid}`)}
              >
                상세보기 ›
              </button>
            </div>

            {order.order_items?.map((item, index) => (
              <div key={index} className="order-content">
                <div className="product-info">
                  {/* 상품 이미지 */}
                  <div
                    className="product-image"
                    onClick={() => navigate(`/product/${item.products?.pid}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {item.products?.thumbnail_url && (
                      <img src={item.products.thumbnail_url} alt={item.product_name} />
                    )}
                  </div>

                  <div className="product-details">
                    {/* 브랜드명 */}
                    <p
                      className="product-brand"
                      onClick={() => navigate(`/brand/${item.products?.brands?.bid}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.product_brand || item.products?.brands?.name}
                    </p>

                    {/* 상품명 */}
                    <p
                      className="product-name"
                      onClick={() => navigate(`/product/${item.products?.pid}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.product_name}
                    </p>

                    <p className="product-option">
                      {item.sku_options && Object.entries(item.sku_options).map(([key, value]) => (
                        `${key}: ${value}`
                      )).join(' / ')} / {item.quantity}개
                    </p>
                    <div className="delivery-status">
                      {getStatusText(order.status)}
                    </div>
                  </div>

                  <div className="product-actions">
                    <p className="product-price">{formatPrice(item.line_subtotal)}</p>

                    {/* 배송중이거나 배송완료면 배송조회 버튼 표시 */}
                    {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                      <button
                        className="action-btn"
                        onClick={() => navigate(`/order/tracking/${order.oid}`)}
                      >
                        배송조회
                      </button>
                    )}

                    {/* 배송완료면 리뷰작성 버튼도 표시 */}
                    {order.status === 'DELIVERED' && (
                      reviewStatuses[item.oiid] ? (
                        // 리뷰 작성 완료 - 리뷰보기 버튼
                        <button
                          className="action-btn review-written"
                          onClick={() => {
                            navigate('/mypage', {
                              state: {
                                activeMenu: '상품리뷰',
                                activeTab: 'written'
                              }
                            });
                          }}
                        >
                          리뷰보기
                        </button>
                      ) : (
                        // 리뷰 미작성 - 리뷰작성 버튼
                        <button
                          className="action-btn"
                          onClick={() => handleWriteReview(item)}
                        >
                          리뷰작성
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="empty-content">
          <p>최근 1개월 내 주문 내역이 없습니다.</p>
        </div>
      )}

      {/* 리뷰 작성 모달 */}
      {reviewModalOpen && selectedOrderItem && (
        <ReviewWriteModal
          orderItem={selectedOrderItem}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedOrderItem(null);
          }}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}