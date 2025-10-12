import React from 'react';
import './NotificationSettings.css';

export default function NotificationSettings({ detailedUserInfo, onSave }) {
  return (
    <div className="notification-settings-container">
      <h2 className="content-title">알림 설정</h2>
      <form onSubmit={onSave} className="notification-container">
        <div className="notification-item">
          <div>
            <p className="notification-title">주문/배송 알림</p>
            <p className="notification-desc">주문 및 배송 상태 변경 시 알림을 받습니다</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              name="order_status"
              defaultChecked={detailedUserInfo?.notification_settings?.order_status}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="notification-item">
          <div>
            <p className="notification-title">이벤트/프로모션 알림</p>
            <p className="notification-desc">할인 이벤트 및 프로모션 정보를 받습니다</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              name="marketing"
              defaultChecked={detailedUserInfo?.notification_settings?.marketing}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="notification-item">
          <div>
            <p className="notification-title">재입고 알림</p>
            <p className="notification-desc">관심 상품 재입고 시 알림을 받습니다</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              name="product_restock"
              defaultChecked={detailedUserInfo?.notification_settings?.product_restock}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="notification-item">
          <div>
            <p className="notification-title">할인 알림</p>
            <p className="notification-desc">관심 상품 할인 시 알림을 받습니다</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              name="product_discount"
              defaultChecked={detailedUserInfo?.notification_settings?.product_discount}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="notification-item">
          <div>
            <p className="notification-title">배송 알림</p>
            <p className="notification-desc">배송 시작 및 완료 시 알림을 받습니다</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              name="shipping"
              defaultChecked={detailedUserInfo?.notification_settings?.shipping}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="form-submit">
          <button type="submit" className="submit-btn">설정 저장</button>
        </div>
      </form>
    </div>
  );
}