import React from 'react';

const AddressModal = ({
  showAddressModal,
  editingAddress,
  addresses,
  selectedAddress,
  addressForm,
  onAddressFormChange,
  onPostcodeSearch,
  onSaveAddress,
  onStartEditAddress,
  onDeleteAddress,
  onSelectAddress,
  onCloseModal
}) => {
  if (!showAddressModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{editingAddress ? '배송지 수정' : '배송지 추가'}</h3>
          <button className="modal-close" onClick={onCloseModal}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* 기존 주소 목록 */}
          {!editingAddress && addresses.length > 0 && (
            <div className="existing-addresses">
              <h4>기존 주소 목록</h4>
              {addresses.map((addr) => (
                <div 
                  key={addr.aid} 
                  className={`address-item ${selectedAddress?.aid === addr.aid ? 'selected' : ''}`}
                >
                  <div 
                    className="address-content" 
                    onClick={() => onSelectAddress(addr)}
                  >
                    <div className="address-name">
                      {addr.name}
                      {addr.is_default && <span className="default-badge">기본</span>}
                    </div>
                    <div className="address-recipient">
                      {addr.recipient_name} | {addr.recipient_phone}
                    </div>
                    <div className="address-detail">
                      [{addr.postal_code}] {addr.address} {addr.detail_address}
                    </div>
                  </div>
                  <div className="address-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => onStartEditAddress(addr)}
                    >
                      수정
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => onDeleteAddress(addr.aid)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              <div className="modal-divider"></div>
            </div>
          )}

          {/* 주소 입력 폼 */}
          <form onSubmit={onSaveAddress}>
            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                name="recipient_name"
                value={addressForm.recipient_name}
                onChange={onAddressFormChange}
                placeholder="받는 분의 이름을 입력해주세요."
                required
              />
            </div>

            <div className="form-group">
              <label>연락처</label>
              <input
                type="tel"
                value={addressForm.recipient_phone}
                onChange={(e) => onAddressFormChange('recipient_phone', e.target.value)}
                placeholder="휴대폰번호를 입력해주세요."
                maxLength="13"
                required
              />
            </div>

            <div className="form-group">
              <label>주소</label>
              <div className="postcode-input">
                <input
                  type="text"
                  name="postal_code"
                  value={addressForm.postal_code}
                  onChange={onAddressFormChange}
                  placeholder="우편번호"
                  readOnly
                  required
                />
                <button 
                  type="button" 
                  className="btn-postcode" 
                  onClick={onPostcodeSearch}
                >
                  주소 찾기
                </button>
              </div>
              <input
                type="text"
                name="address"
                value={addressForm.address}
                onChange={onAddressFormChange}
                placeholder="주소"
                readOnly
                required
              />
              <input
                type="text"
                name="detail_address"
                value={addressForm.detail_address}
                onChange={onAddressFormChange}
                placeholder="상세 주소"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={addressForm.is_default}
                  onChange={onAddressFormChange}
                />
                기본 배송지로 설정
              </label>
            </div>

            <div className="modal-actions">
              <button type="submit" className="btn-save">
                {editingAddress ? '수정' : '저장'}
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={onCloseModal}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;