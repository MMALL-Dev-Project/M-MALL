import React from 'react';
import { useCheckout } from './useCheckout';
import AddressModal from './AddressModal';
import './Checkout.css';

const Checkout = () => {
  const {
    // 상태
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

    // 상태 변경 함수
    setSelectedAddress,
    setSelectedPayment,
    setSelectedCard,
    setShowAddressModal,

    // 이벤트 핸들러
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
        <div className="checkout-header">
          <h2>주문서</h2>
        </div>

        <div className="checkout-content">
          {/* 왼쪽 스크롤 영역 */}
          <div className="checkout-left">
            {/* 주문 상품 정보 */}
            <section className="checkout-section">
              <h3 className="section-title">주문 상품 ({orderItems.length}개)</h3>
              <div className="order-items">
                {orderItems.map((item, index) => (
                  <div key={`${item.pid}-${item.skid}-${index}`} className="order-item">
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
                      <div className="point-info">
                        적립 포인트: {Math.floor(item.itemTotal * (item.product.point_rate || 1) / 100)}P
                      </div>
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
              
              {pricing.earnedPoints > 0 && (
                <div className="earn-points">
                  <span>적립 예정 포인트</span>
                  <span className="points">{pricing.earnedPoints.toLocaleString()}P</span>
                </div>
              )}
              
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