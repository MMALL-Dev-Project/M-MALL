import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import Modal from '@/components/common/modal/Modal';

const AuthCallback = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          navigate('/login');
          return;
        }

        const name = session.user.user_metadata?.name || '회원';
        setUserName(name);
        setModalOpen(true);

        setTimeout(() => {
          navigate('/');
        }, 3000);

      } catch (err) {
        console.error('AuthCallback 에러:', err);
        navigate('/login');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <Modal isOpen={modalOpen} onClose={() => navigate('/')}>
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>
          {userName}님 환영합니다! 🎉
        </h2>
        <p style={{ color: '#666', lineHeight: '1.6' }}>
          이메일 인증이 완료되었습니다.
        </p>
      </div>
    </Modal>
  );
};

export default AuthCallback;