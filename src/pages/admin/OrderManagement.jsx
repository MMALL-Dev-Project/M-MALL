import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import Pagination from '../../components/common/Pagination';
import './OrderManagement.css';

const OrderManagement = () => {
  const navigate = useNavigate();
  const { user, userInfo } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 5;
  const [shippingForm, setShippingForm] = useState({
    tracking_number: '',
    shipping_company: 'CJ대한통운'
  });

  // 송장번호 자동 생성 함수
  const generateTrackingNumber = (company) => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const prefixes = {
      'CJ대한통운': 'CJ',
      '로젠택배': 'LG',
      '한진택배': 'HJ',
      '우체국택배': 'KP',
      '롯데택배': 'LT'
    };
    
    const prefix = prefixes[company] || 'CJ';
    return `${prefix}${timestamp.slice(-8)}${random}`;
  };

  // 택배사 변경 시 송장번호 자동 생성
  const handleCompanyChange = (company) => {
    const autoTrackingNumber = generateTrackingNumber(company);
    setShippingForm(prev => ({
      ...prev,
      shipping_company: company,
      tracking_number: autoTrackingNumber
    }));
  };

  // 관리자 권한 체크
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // userInfo가 아직 로드되지 않은 경우 기다림
    if (!userInfo) {
      return;
    }

    // 관리자가 아니면 접근 거부
    if (userInfo.role !== 'admin') {
      alert('관리자만 접근할 수 있습니다.');
      navigate('/');
      return;
    }

    loadOrders();
  }, [user, userInfo, statusFilter, currentPage]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // 1. 전체 주문 수 카운트
      let countQuery = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (statusFilter !== 'ALL') {
        countQuery = countQuery.eq('status', statusFilter);
      }

      const { count } = await countQuery;
      setTotalOrders(count || 0);
      
      // 2. 페이지네이션 적용하여 주문 데이터 가져오기
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
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1);

      if (statusFilter !== 'ALL') {
        ordersQuery = ordersQuery.eq('status', statusFilter);
      }

      const { data: ordersData, error: ordersError } = await ordersQuery;
      
      if (ordersError) throw ordersError;

      // 3. 각 주문에 대해 사용자 정보와 주소 정보를 별도로 가져오기
      const ordersWithUserInfo = await Promise.all(
        ordersData.map(async (order) => {
          // 사용자 정보 가져오기
          const { data: userInfo, error: userError } = await supabase
            .from('user_info')
            .select('name, user_id, phone')
            .eq('id', order.uid)
            .single();

          if (userError) console.error('사용자 정보 조회 오류:', userError);

          // 주소 정보 가져오기 (address_id가 있는 경우만)
          let addressInfo = null;
          if (order.address_id) {
            const { data: addressData, error: addressError } = await supabase
              .from('user_addresses')
              .select('recipient_name, recipient_phone, address, detail_address, postal_code')
              .eq('aid', order.address_id)
              .maybeSingle(); // single() 대신 maybeSingle() 사용

            if (addressError) {
              console.error('주소 정보 조회 오류:', addressError);
            } else {
              addressInfo = addressData;
            }
          }

          return {
            ...order,
            user_info: userInfo,
            user_addresses: addressInfo
          };
        })
      );

      setOrders(ordersWithUserInfo || []);
    } catch (error) {
      console.error('주문 목록 로드 오류:', error);
      alert('주문 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('oid', orderId);

      if (error) throw error;

      await loadOrders();
      
      alert('주문 상태가 변경되었습니다.');
    } catch (error) {
      console.error('주문 상태 변경 오류:', error);
      alert('주문 상태 변경에 실패했습니다.');
    }
  };

  const updateShippingInfo = async (orderId) => {
    if (!shippingForm.tracking_number.trim()) {
      alert('송장번호를 입력해주세요.');
      return;
    }

    try {
      const updateData = {
        status: 'SHIPPED',
        tracking_number: shippingForm.tracking_number,
        shipping_company: shippingForm.shipping_company,
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('oid', orderId);

      if (error) throw error;

      alert('배송 정보가 등록되었습니다.');
      setShippingForm({ tracking_number: '', shipping_company: 'CJ대한통운' });
      setSelectedOrder(null);
      loadOrders();
    } catch (error) {
      console.error('배송 정보 업데이트 오류:', error);
      alert('배송 정보 등록에 실패했습니다.');
    }
  };

  const markAsDelivered = async (orderId) => {
    if (!confirm('배송 완료로 처리하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'DELIVERED',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('oid', orderId);

      if (error) throw error;

      await loadOrders();
      
      alert('배송이 완료 처리되었습니다.');
    } catch (error) {
      console.error('배송 완료 처리 오류:', error);
      alert('배송 완료 처리에 실패했습니다.');
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // 필터 변경 시 페이지 리셋
  const handleFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-order-container">
      <div className="admin-header">
        <div className="container">
          <h1 className="admin-title">주문 관리</h1>
          
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
                <div className="order-number">
                  주문번호: {order.oid.toString().padStart(10, '0')}
                </div>
                <div className="order-date">
                  주문일시: {formatDate(order.created_at)}
                </div>
                <div className="order-customer">
                  주문자: {order.user_info?.name} ({order.user_info?.user_id})
                </div>
              </div>
              <div className="order-status">
                <span className={`status-badge status-${order.status.toLowerCase()}`}>
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
                </div>
              </div>
            )}

            <div className="order-actions">
              <div className="action-buttons">
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => updateOrderStatus(order.oid, 'CONFIRMED')}
                    className="btn btn-confirm"
                  >
                    주문 확인
                  </button>
                )}
                
                {order.status === 'CONFIRMED' && (
                  <button
                    onClick={() => updateOrderStatus(order.oid, 'PREPARING')}
                    className="btn btn-prepare"
                  >
                    상품 준비중
                  </button>
                )}

                {order.status === 'PREPARING' && (
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="btn btn-ship"
                  >
                    배송 시작
                  </button>
                )}

                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => markAsDelivered(order.oid)}
                    className="btn btn-deliver"
                  >
                    배송 완료
                  </button>
                )}

                {order.status === 'DELIVERED' && (
                  <div className="delivery-completed">
                    <span className="completed-text">배송 완료됨</span>
                  </div>
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

      {/* 페이지네이션 */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalOrders / itemsPerPage)}
        onPageChange={handlePageChange}
        totalItems={totalOrders}
        itemsPerPage={itemsPerPage}
      />

      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              배송 정보 입력 - 주문번호 {selectedOrder.oid.toString().padStart(10, '0')}
            </h3>
            
            <div className="form-group">
              <label className="form-label">택배사</label>
              <select
                value={shippingForm.shipping_company}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="form-select"
              >
                <option value="CJ대한통운">CJ대한통운</option>
                <option value="로젠택배">로젠택배</option>
                <option value="한진택배">한진택배</option>
                <option value="우체국택배">우체국택배</option>
                <option value="롯데택배">롯데택배</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">송장번호</label>
              <div className="tracking-input-group">
                <input
                  type="text"
                  value={shippingForm.tracking_number}
                  onChange={(e) => setShippingForm(prev => ({ ...prev, tracking_number: e.target.value }))}
                  placeholder="송장번호가 자동 생성됩니다"
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => handleCompanyChange(shippingForm.shipping_company)}
                  className="btn-regenerate"
                >
                  재생성
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => updateShippingInfo(selectedOrder.oid)}
                className="btn btn-primary"
              >
                배송 시작
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setShippingForm({ tracking_number: '', shipping_company: 'CJ대한통운' });
                }}
                className="btn btn-secondary"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className="empty-state">
          {statusFilter === 'ALL' ? '주문이 없습니다.' : `${getStatusText(statusFilter)} 상태의 주문이 없습니다.`}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;