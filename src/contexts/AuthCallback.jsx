// src/pages/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const AuthCallback = () => {
  const [status, setStatus] = useState('처리 중...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchUserInfo } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const tokenHash = searchParams.get('token_hash');
        const type      = searchParams.get('type');
        if (!tokenHash || !type) {
          setStatus('잘못된 인증 링크입니다.');
          return setTimeout(() => navigate('/signup'), 3000);
        }

        // 이메일 인증
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (error) {
          console.error(error);
          setStatus('인증에 실패했습니다.');
          return setTimeout(() => navigate('/signup'), 3000);
        }

        // pendingProfile 꺼내서 INSERT
        const pending = localStorage.getItem('pendingProfile');
        let profile;
        if (pending) {
          profile = JSON.parse(pending);
          try {
            await supabase.from('user_info').insert(profile);
            localStorage.removeItem('pendingProfile');

            // 500ms 지연 후 fetchUserInfo 호출
            setTimeout(async () => {
              await fetchUserInfo(data.user.id);
            }, 500);
          } catch (insertErr) {
            console.error('프로필 저장 오류:', insertErr);
            setStatus('프로필 저장 중 오류가 발생했습니다.');
          }
        }

        // 2초 뒤 홈으로 이동하며 이름도 state로 전달
        setTimeout(() => {
          navigate('/', { state: { justSignedUp: true, name: profile?.name } });
        }, 2000);

      } catch (err) {
        console.error(err);
        setStatus('오류가 발생했습니다.');
        setTimeout(() => navigate('/signup'), 3000);
      }
    };

    handleAuth();
  }, [navigate, searchParams, fetchUserInfo]);

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      justifyContent:'center',
      height:        '100vh'
    }}>
      <h2>이메일 인증</h2>
      <p>{status}</p>
    </div>
  );
};

export default AuthCallback;