import React from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderHistory.css';

export default function OrderHistory({ orderStats, recentOrders }) {
  const navigate = useNavigate();

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
                      <button 
                        className="action-btn"
                        onClick={() => navigate(`/review/write?orderItemId=${item.oiid}&productId=${item.products?.pid}`)}
                      >
                        리뷰작성
                      </button>
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
    </div>
  );
}