import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

const AuthCallback = () => {
  const [status, setStatus] = useState('이메일 인증 완료 중...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          setStatus('인증에 실패했습니다.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        setStatus('인증이 완료되었습니다');
        setTimeout(() => navigate('/'), 3000);

      } catch (err) {
        console.error('AuthCallback 에러:', err);
        setStatus('오류가 발생했습니다.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh'
    }}>
      <h2>이메일 인증</h2>
      <p>{status}</p>
    </div>
  );
};

export default AuthCallback;