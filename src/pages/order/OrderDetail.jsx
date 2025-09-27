import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import './OrderDetail.css';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [orderData, setOrderData] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (orderId) {
      loadOrderDetail();
    }
  }, [user, orderId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);

    // 주문 정보 조회
    const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
        *,
        user_addresses!address_id (
        name,
        recipient_name,
        recipient_phone,
        postal_code,
        address,
        detail_address
        )
    `)
    .eq('oid', orderId)
    .eq('uid', user.id)
    .single();

    console.log('조회된 주문 데이터:', order);
console.log('address_id:', order.address_id);
console.log('user_addresses:', order.user_addresses);

      if (orderError) throw orderError;

      // 주문 아이템들 조회
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            name,
            thumbnail_url,
            brands (name)
          )
        `)
        .eq('oid', orderId);

      if (itemsError) throw itemsError;

      setOrderData(order);
      setOrderItems(items || []);
    } catch (err) {
      console.error('주문 상세 조회 오류:', err);
      setError('주문 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}(${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]})`;
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
      'PENDING': '#ff6b35',
      'CONFIRMED': '#016ACA',
      'PREPARING': '#016ACA',
      'SHIPPED': '#016ACA',
      'DELIVERED': '#28a745',
      'CANCELLED': '#dc3545'
    };
    return colorMap[status] || '#666';
  };

  if (loading) {
    return (
      <div className="order-detail-loading">
        <div className="loading-spinner">로딩 중...</div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="order-detail-error">
        <p>{error || '주문 정보를 찾을 수 없습니다.'}</p>
        <button onClick={() => navigate('/mypage/orders')}>주문 내역으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div id="orderdetail" className="order-detail-container">
      <div id="orderdetail" className="order-detail-wrapper">
        {/* 주문 정보 헤더 */}
        <div id="orderdetail" className="order-header">
          <div id="orderdetail" className="order-date">
            <h2>주문 상세</h2>
            <div id="orderdetail" className="order-info">
              <span id="orderdetail" className="date">{formatDate(orderData.created_at)}</span>
              <span id="orderdetail" className="order-number">주문번호 {orderData.oid.toString().padStart(10, '0')}</span>
            </div>
          </div>
          <div id="orderdetail" className="order-status">
            <span 
              id="orderdetail"
              className="status-badge"
              style={{ color: getStatusColor(orderData.status) }}
            >
              {getStatusText(orderData.status)}
            </span>
          </div>
        </div>

        {/* 배송지 정보 */}
        <section id="orderdetail" className="order-section">
        <h3>배송지</h3>
        <div id="orderdetail" className="address-info">
            {orderData.user_addresses ? (
            <>
                <div id="orderdetail" className="address-recipient">
                {orderData.user_addresses.recipient_name} | {orderData.user_addresses.recipient_phone}
                </div>
                <div id="orderdetail" className="address-detail">
                [{orderData.user_addresses.postal_code}] {orderData.user_addresses.address} {orderData.user_addresses.detail_address}
                </div>
            </>
            ) : (
            <div>배송지 정보가 없습니다.</div>
            )}
        </div>
        </section>

        {/* 배송 정보 */}
        <section id="orderdetail" className="order-section">
          <h3>배송</h3>
          <div id="orderdetail" className="shipping-info">
            {orderData.tracking_number ? (
              <div id="orderdetail" className="tracking-info">
                <div id="orderdetail" className="tracking-row">
                  <span id="orderdetail" className="label">택배사</span>
                  <span id="orderdetail" className="value">{orderData.shipping_company}</span>
                </div>
                <div id="orderdetail" className="tracking-row">
                  <span id="orderdetail" className="label">송장번호</span>
                  <span id="orderdetail" className="value">{orderData.tracking_number}</span>
                </div>
                {orderData.shipped_at && (
                  <div id="orderdetail" className="tracking-row">
                    <span id="orderdetail" className="label">배송시작일</span>
                    <span id="orderdetail" className="value">{formatDate(orderData.shipped_at)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div id="orderdetail" className="no-tracking">
                <p>배송 준비중입니다.</p>
              </div>
            )}
          </div>
        </section>

        {/* 주문 상품 목록 */}
        <section id="orderdetail" className="order-section">
          <h3>주문 상품 {orderItems.length}개</h3>
          <div id="orderdetail" className="order-items">
            {orderItems.map((item, index) => (
              <div key={index} id="orderdetail" className="order-item">
                <div id="orderdetail" className="item-image">
                  <img 
                    src={item.products?.thumbnail_url || '/M-MALL/images/default-product.png'} 
                    alt={item.product_name}
                  />
                </div>
                <div id="orderdetail" className="item-info">
                  <div id="orderdetail" className="item-brand">{item.product_brand}</div>
                  <div id="orderdetail" className="item-name">{item.product_name}</div>
                  {item.sku_options && Object.keys(item.sku_options).length > 0 && (
                    <div id="orderdetail" className="item-options">
                      {Object.entries(item.sku_options).map(([key, value]) => (
                        <span key={key}>{key}: {value}</span>
                      ))}
                    </div>
                  )}
                  <div id="orderdetail" className="item-quantity">수량: {item.quantity}개</div>
                </div>
                <div id="orderdetail" className="item-actions">
                  <div id="orderdetail" className="item-price">
                    {(item.unit_sale_price * item.quantity).toLocaleString()}원
                  </div>
                  <div id="orderdetail" className="action-buttons">
                    <button id="orderdetail" className="btn-review">후기 작성</button>
                    <button id="orderdetail" className="btn-inquiry">상품 문의</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 결제 정보 */}
        <section id="orderdetail" className="order-section">
          <h3>결제 정보</h3>
          <div id="orderdetail" className="payment-info">
            <div id="orderdetail" className="payment-details">
              <div id="orderdetail" className="payment-row">
                <span id="orderdetail" className="label">상품 금액</span>
                <span id="orderdetail" className="value">
                  {orderItems.reduce((sum, item) => sum + (item.unit_original_price * item.quantity), 0).toLocaleString()}원
                </span>
              </div>
              <div id="orderdetail" className="payment-row">
                <span id="orderdetail" className="label">할인 금액</span>
                <span id="orderdetail" className="value discount">
                  -{(orderItems.reduce((sum, item) => sum + (item.unit_original_price * item.quantity), 0) - orderData.total_amount).toLocaleString()}원
                </span>
              </div>
              <div id="orderdetail" className="payment-row">
                <span id="orderdetail" className="label">배송비</span>
                <span id="orderdetail" className="value">무료배송</span>
              </div>
              <div id="orderdetail" className="payment-divider"></div>
              <div id="orderdetail" className="payment-row total">
                <span id="orderdetail" className="label">결제 금액</span>
                <span id="orderdetail" className="value">{orderData.total_amount.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </section>

        {/* 하단 버튼들 */}
        <div id="orderdetail" className="order-actions">
          <button id="orderdetail" className="btn-back" onClick={() => navigate('/mypage/orders')}>
            주문 내역 보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;