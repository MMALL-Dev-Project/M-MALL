import { useCheckout } from './useCheckout';
import AddressModal from './AddressModal';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  
  const {
    orderItems,
    addresses,
    selectedAddress,
    loading,
    usePoints,
    pointsToUse,
    maxPointsUsable,
    selectedPayment,
    selectedCard,
    pricing,
    showAddressModal,
    editingAddress,
    addressForm,
    userInfo,
    setSelectedAddress,
    setSelectedPayment,
    setSelectedCard,
    setShowAddressModal,
    handlePointsToggle,
    handlePointsChange,
    handleUseAllPoints,
    handleAddressFormChange,
    openPostcodeSearch,
    handleSaveAddress,
    startEditAddress,
    handleDeleteAddress,
    closeAddressModal,
    handleOrder
  } = useCheckout();

  const [timeLeft, setTimeLeft] = useState(0);
  const [showExtendButton, setShowExtendButton] = useState(false);
  const [extendButtonTimer, setExtendButtonTimer] = useState(null);

  // ✅ 재고 복구 함수 (실재고 복구 + 예약재고 해제)
  const releaseReservedStock = async () => {
    try {
      const checkoutItems = JSON.parse(sessionStorage.getItem('checkoutItems') || '[]');
      
      if (checkoutItems.length === 0) {
        console.log('⚠️ 복구할 아이템 없음');
        return;
      }
      
      console.log('🔄 재고 복구 시작:', checkoutItems);
      
      for (const item of checkoutItems) {
        const { data: currentSku } = await supabase
          .from('product_skus')
          .select('stock_qty, reserved_qty')
          .eq('skid', item.skid)
          .single();

        console.log('복구 전:', {
          skid: item.skid,
          stock_qty: currentSku.stock_qty,
          reserved_qty: currentSku.reserved_qty
        });

        await supabase
          .from('product_skus')
          .update({ 
            stock_qty: currentSku.stock_qty + item.quantity,              // ✅ 실재고 복구
            reserved_qty: Math.max(0, (currentSku.reserved_qty || 0) - item.quantity)  // ✅ 예약재고 해제
          })
          .eq('skid', item.skid);
        
        console.log(`✅ 재고 복구 완료: stock_qty ${currentSku.stock_qty} → ${currentSku.stock_qty + item.quantity}, reserved_qty ${currentSku.reserved_qty} → 0`);
      }
      
      console.log('✅ 모든 재고 복구 & 예약 해제 완료');
    } catch (error) {
      console.error('❌ 재고 복구 실패:', error);
    }
  };

  // ✅ 언마운트 시 재고 복구 (조건부)
  useEffect(() => {
    return () => {
      const stockReserved = sessionStorage.getItem('stockReserved');
      const checkoutItems = sessionStorage.getItem('checkoutItems');
      
      console.log('📍 언마운트 체크:', { 
        stockReserved, 
        hasCheckoutItems: !!checkoutItems 
      });
      
      // stockReserved가 'true'이고 checkoutItems가 있으면 복구
      if (stockReserved === 'true' && checkoutItems) {
        console.log('🔄 페이지 이탈 감지 - 재고 복구 시작');
        releaseReservedStock();
        sessionStorage.removeItem('checkoutItems');
        sessionStorage.removeItem('stockReserved');
        localStorage.removeItem('orderTimer');
      } else {
        console.log('✅ 재고 복구 안 함 (주문 완료됨)');
      }
    };
  }, []);

  // ✅ 타이머 로직
  useEffect(() => {
    const endTime = localStorage.getItem('orderTimer');
    if (!endTime) return;

    const timer = setInterval(() => {
      const remaining = parseInt(endTime) - Date.now();
      
      if (remaining <= 0) {
        console.log('⏰ 타이머 만료 - 재고 복구');
        releaseReservedStock();
        localStorage.removeItem('orderTimer');
        sessionStorage.removeItem('checkoutItems');
        sessionStorage.removeItem('stockReserved');
        alert('주문 시간이 만료되었습니다.');
        navigate(-1);
        clearInterval(timer);
        return;
      }
      
      setTimeLeft(remaining);
      
      // 2분 남았을 때 연장 버튼 표시
      if (remaining <= 2 * 60 * 1000 && !showExtendButton) {
        setShowExtendButton(true);
        
        // 1분 후 자동으로 뒤로가기
        const autoExit = setTimeout(() => {
          console.log('⏰ 자동 종료 - 재고 복구');
          releaseReservedStock();
          localStorage.removeItem('orderTimer');
          sessionStorage.removeItem('checkoutItems');
          sessionStorage.removeItem('stockReserved');
          alert('주문 시간이 만료되었습니다.');
          navigate(-1);
        }, 60 * 1000);
        
        setExtendButtonTimer(autoExit);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      if (extendButtonTimer) clearTimeout(extendButtonTimer);
    };
  }, [showExtendButton]);

  const handleExtend = () => {
    const newEndTime = Date.now() + (10 * 60 * 1000);
    localStorage.setItem('orderTimer', newEndTime.toString());
    setTimeLeft(10 * 60 * 1000);
    setShowExtendButton(false);
    
    if (extendButtonTimer) {
      clearTimeout(extendButtonTimer);
      setExtendButtonTimer(null);
    }
    
    console.log('⏰ 타이머 10분 연장');
  };

  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="loading-spinner">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        {showExtendButton && (
          <div style={{
            background: 'linear-gradient(135deg, #ff4444, #cc0000)',
            color: 'white',
            padding: '15px',
            textAlign: 'center',
            borderRadius: '8px',
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>
            주문 시간이 2분 남았습니다. 1분 후 자동으로 나갑니다.
            <button
              onClick={handleExtend}
              style={{
                marginLeft: '15px',
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid white',
                color: 'white',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              10분 연장
            </button>
          </div>
        )}

        <div className="checkout-header">
          <h2>주문서</h2>
        </div>

        <div className="checkout-content">
          {/* 왼쪽 스크롤 영역 */}
          <div className="checkout-left">
            {/* 주문 상품 정보 */}
            <section className="checkout-section">
              <h3 className="section-title">주문 상품 ({orderItems.length}개)</h3>
              <div className="order-checkout-items">
                {orderItems.map((item, index) => (
                  <div key={`${item.pid}-${item.skid}-${index}`} className="checkout-order-item">
                    <div className="item-image">
                      <img
                        src={item.product.thumbnail_url || '/M-MALL/images/default-product.png'}
                        alt={item.product.name}
                      />
                    </div>
                    <div className="item-info">
                      <div className="item-brand">{item.product.brands?.name}</div>
                      <div className="item-name">{item.product.name}</div>
                      {item.sku?.options && (
                        <div className="item-options">
                          {Object.entries(item.sku.options).map(([key, value]) => (
                            <span key={key}>{key}: {value}</span>
                          ))}
                        </div>
                      )}
                      <div className="item-quantity">수량: {item.quantity}개</div>
                    </div>
                    <div className="item-price">
                      <div className="price">{item.itemTotal.toLocaleString()}원</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 배송지 정보 */}
            <section className="checkout-section">
              <div className="section-header">
                <h3 className="section-title">배송지</h3>
                <button
                  className="btn-change"
                  onClick={() => setShowAddressModal(true)}
                >
                  배송지 변경
                </button>
              </div>
              {selectedAddress ? (
                <div className="address-info">
                  <div className="address-name">{selectedAddress.name}</div>
                  <div className="address-recipient">
                    {selectedAddress.recipient_name} | {selectedAddress.recipient_phone}
                  </div>
                  <div className="address-detail">
                    [{selectedAddress.postal_code}] {selectedAddress.address} {selectedAddress.detail_address}
                  </div>
                  {selectedAddress.is_default && (
                    <span className="default-badge">기본 배송지</span>
                  )}
                </div>
              ) : (
                <div className="no-address">
                  <p>등록된 배송지가 없습니다.</p>
                  <button
                    className="btn-add-address"
                    onClick={() => setShowAddressModal(true)}
                  >
                    배송지 추가
                  </button>
                </div>
              )}
            </section>

            {/* M포인트 사용 */}
            <section className="checkout-section">
              <h3 className="section-title">M포인트</h3>
              <div className="points-section">
                <div className="points-header">
                  <label className="points-toggle">
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={(e) => handlePointsToggle(e.target.checked)}
                    />
                    M포인트 사용
                  </label>
                  <div className="points-balance">
                    보유 포인트: {(userInfo?.points_balance || 0).toLocaleString()}P
                  </div>
                </div>

                {usePoints && (
                  <div className="points-input-section">
                    <div className="points-input-wrapper">
                      <input
                        type="number"
                        value={pointsToUse}
                        onChange={(e) => handlePointsChange(e.target.value)}
                        placeholder="0"
                        min="0"
                        max={maxPointsUsable}
                      />
                      <span className="points-unit">P</span>
                      <button
                        className="btn-use-all"
                        onClick={handleUseAllPoints}
                      >
                        전액 사용
                      </button>
                    </div>
                    <div className="points-info">
                      <p>• 상품 금액의 30%까지 사용 가능</p>
                      <p>• 최대 사용 가능: {maxPointsUsable.toLocaleString()}P</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 결제 수단 */}
            <section className="checkout-section">
              <h3 className="section-title">결제 수단</h3>
              <div className="payment-methods">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="kakaopay"
                    checked={selectedPayment === 'kakaopay'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                  />
                  카카오페이
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="naverpay"
                    checked={selectedPayment === 'naverpay'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                  />
                  네이버페이
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="toss"
                    checked={selectedPayment === 'toss'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                  />
                  토스
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={selectedPayment === 'card'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                  />
                  신용카드
                </label>

                {selectedPayment === 'card' && (
                  <div className="card-selection">
                    <select
                      value={selectedCard}
                      onChange={(e) => setSelectedCard(e.target.value)}
                      required
                    >
                      <option value="">카드를 선택하세요</option>
                      <option value="hyundai">현대카드</option>
                      <option value="samsung">삼성카드</option>
                      <option value="shinhan">신한카드</option>
                      <option value="kb">KB국민카드</option>
                      <option value="nh">NH농협카드</option>
                      <option value="lotte">롯데카드</option>
                      <option value="bc">BC카드</option>
                      <option value="hana">하나카드</option>
                      <option value="city">씨티카드</option>
                    </select>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 오른쪽 고정 결제 영역 */}
          <div className="checkout-right">
            <div className="payment-summary">
              <h3>결제 금액</h3>

              <div className="price-row">
                <span>상품 금액</span>
                <span>{pricing.subtotal.toLocaleString()}원</span>
              </div>

              <div className="price-row">
                <span>배송비</span>
                <span>무료</span>
              </div>

              {/* 무료배송 안내 */}
              <div className="free-shipping-notice">
                <div className="shipping-benefit">
                  <div className="shipping-text">
                  </div>
                </div>
              </div>

              {usePoints && pricing.pointDiscount > 0 && (
                <div className="price-row discount">
                  <span>M포인트 할인</span>
                  <span>-{pricing.pointDiscount.toLocaleString()}원</span>
                </div>
              )}

              <div className="price-divider"></div>

              <div className="price-row total">
                <span>총 결제 금액</span>
                <span>{pricing.finalTotal.toLocaleString()}원</span>
              </div>

              {/* 추가 혜택 안내 */}
              <div className="order-benefits">
                <div className="benefit-item">
                  <div className="shipping-desc">
                    전 상품 무료배송으로 배송비 걱정 없이<br></br> 쇼핑하세요!
                  </div>
                  <span>평일 오후 2시 이전 주문 시 당일 발송</span>
                </div>
              </div>

              <button
                className="btn-order"
                onClick={handleOrder}
                disabled={!selectedAddress || !selectedPayment}
              >
                {pricing.finalTotal.toLocaleString()}원 결제하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 주소 관리 모달 */}
      <AddressModal
        showAddressModal={showAddressModal}
        editingAddress={editingAddress}
        addresses={addresses}
        selectedAddress={selectedAddress}
        addressForm={addressForm}
        onAddressFormChange={handleAddressFormChange}
        onPostcodeSearch={openPostcodeSearch}
        onSaveAddress={handleSaveAddress}
        onStartEditAddress={startEditAddress}
        onDeleteAddress={handleDeleteAddress}
        onSelectAddress={(addr) => {
          setSelectedAddress(addr);
          setShowAddressModal(false);
        }}
        onCloseModal={closeAddressModal}
      />
    </div>
  );
};

export default Checkout;