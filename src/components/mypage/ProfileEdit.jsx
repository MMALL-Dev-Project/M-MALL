import React, { useState } from 'react';
import { supabase } from '../../config/supabase';
import './ProfileEdit.css';

export default function ProfileEdit({ userInfo, detailedUserInfo, onSave }) {
  const DEFAULT_AVATAR = 'https://csitasavsenhjprwwdup.supabase.co/storage/v1/object/public/user-profiles/default-avatar.png';

  const getInitialImage = () => {
    const profileImg = detailedUserInfo?.profile_image;
    if (!profileImg || profileImg === 'default.jpg' || profileImg === "'default.jpg'" || profileImg.includes('default')) {
      return DEFAULT_AVATAR;
    }
    return profileImg;
  };

  const [profileImage, setProfileImage] = useState(getInitialImage());
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  // 프로필 이미지 변경 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 프로필 이미지 업로드
  const uploadProfileImage = async () => {
    if (!selectedFile) return null;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const userId = detailedUserInfo?.id;

      if (!userId) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return null;
      }

      const fileName = `${userId}/${Date.now()}.${fileExt}`; // 이 줄 수정!

      const { error: uploadError } = await supabase.storage
        .from('user-profiles')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-profiles')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드에 실패했습니다.');
      return null;
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. 이미지 업로드
      let profileImageUrl = detailedUserInfo?.profile_image;
      if (selectedFile) {
        const uploadedUrl = await uploadProfileImage();
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      }

      // 2. FormData 생성
      const formData = new FormData(e.target);

      // 3. DB에 직접 저장
      const { error } = await supabase
        .from('user_info')
        .update({
          name: formData.get('name'),
          phone: formData.get('phone'),
          address: formData.get('address'),
          profile_image: profileImageUrl
        })
        .eq('id', detailedUserInfo?.id);

      if (error) throw error;

      alert('회원정보가 수정되었습니다.');

      // 4. AuthContext의 userInfo 새로고침
      window.location.reload();

      setSelectedFile(null);
    } catch (error) {
      console.error('저장 오류:', error);
      alert('회원정보 수정에 실패했습니다.');
    }
  };

  // 현재 비밀번호 확인
  const handleVerifyPassword = async () => {
    if (!currentPassword.trim()) {
      alert('현재 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const tempClient = createClient(
        supabase.supabaseUrl,
        supabase.supabaseKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );

      const { error } = await tempClient.auth.signInWithPassword({
        email: detailedUserInfo?.email,
        password: currentPassword
      });

      if (error) {
        alert('현재 비밀번호가 일치하지 않습니다.');
        setIsPasswordVerified(false);
        return;
      }

      alert('확인 완료');
      setIsPasswordVerified(true);
    } catch (error) {
      console.error('비밀번호 확인 오류:', error);
      alert('현재 비밀번호가 일치하지 않습니다.');
      setIsPasswordVerified(false);
    }
  };

  // 비밀번호 변경
  const handlePasswordChange = async () => {
    if (!newPassword.trim() || !newPasswordConfirm.trim()) {
      alert('새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      // Supabase Auth로 비밀번호 변경
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('비밀번호 변경 오류:', error);
        alert('비밀번호 변경에 실패했습니다.');
        return;
      }

      alert('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setIsPasswordVerified(false);
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      alert('비밀번호 변경에 실패했습니다.');
    }
  };

  return (
    <div className="profile-edit-container">
      <h2 className="content-title">회원정보 수정</h2>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label className="form-label">프로필 이미지</label>
          <div className="profile-edit">
            <div className="profile-image-large">
              <img src={profileImage} alt="프로필" />
            </div>
            <input
              type="file"
              id="profile-image-input"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="profile-edit-btn"
              onClick={() => document.getElementById('profile-image-input').click()}
            >
              이미지 변경
            </button>
          </div>
        </div>
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
        <div className="form-group password-change-section">
          <label className="form-label">비밀번호 변경</label>

          <div className="password-input-group">
            <input
              type="password"
              className="form-input"
              placeholder="현재 비밀번호"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isPasswordVerified}
            />
            <button
              type="button"
              className="verify-btn"
              onClick={handleVerifyPassword}
              disabled={isPasswordVerified}
            >
              {isPasswordVerified ? '확인 완료' : '확인'}
            </button>
          </div>

          <input
            type="password"
            className="form-input"
            placeholder="새 비밀번호 (최소 6자)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={!isPasswordVerified}
          />

          <input
            type="password"
            className="form-input"
            placeholder="새 비밀번호 확인"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            disabled={!isPasswordVerified}
          />

          {isPasswordVerified && (
            <button
              type="button"
              className="change-password-btn"
              onClick={handlePasswordChange}
            >
              비밀번호 변경
            </button>
          )}
        </div>

        <div className="form-submit">
          <button type="submit" className="submit-btn">저장하기</button>
        </div>
      </form>
    </div>
  );
}