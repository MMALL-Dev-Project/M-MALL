import React from 'react';
import './ProfileEdit.css';

export default function ProfileEdit({ userInfo, detailedUserInfo, onSave }) {
  return (
    <div className="profile-edit-container">
      <h2 className="content-title">회원정보 수정</h2>
      <form onSubmit={onSave} className="form-container">
        <div className="form-group">
          <label className="form-label">이름</label>
          <input
            type="text"
            name="name"
            className="form-input"
            defaultValue={detailedUserInfo?.name || ''}
          />
        </div>

        <div className="form-group">
          <label className="form-label">이메일</label>
          <input
            type="email"
            className="form-input"
            defaultValue={detailedUserInfo?.email || ''}
            disabled
          />
          <p className="form-help">이메일은 변경할 수 없습니다.</p>
        </div>

        <div className="form-group">
          <label className="form-label">전화번호</label>
          <input
            type="tel"
            name="phone"
            className="form-input"
            defaultValue={detailedUserInfo?.phone || ''}
          />
        </div>

        <div className="form-group">
          <label className="form-label">주소</label>
          <input
            type="text"
            name="address"
            className="form-input"
            defaultValue={detailedUserInfo?.address || ''}
          />
        </div>

        {/* 프로필 이미지 변경 */}
        {/* 비밀번호 변경 */}

        <div className="form-submit">
          <button type="submit" className="submit-btn">저장하기</button>
        </div>
      </form>
    </div>
  );
}