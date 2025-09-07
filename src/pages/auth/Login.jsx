import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });

  // 유효성 검사 상태
  const [errors, setErrors] = useState({});

  // 실시간 유효성 검사 함수
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'userId':
        if (!value) {
          error = '아이디를 입력해주세요.';
        } else if (!/^[a-zA-Z0-9]+$/.test(value)) {
          error = '아이디는 영문과 숫자만 사용 가능합니다.';
        } else if (value.length < 4) {
          error = '아이디는 4자 이상이어야 합니다.';
        }
        break;

      case 'password':
        if (!value) {
          error = '비밀번호를 입력해주세요.';
        } else if (value.length < 6) {
          error = '비밀번호는 6자 이상이어야 합니다.';
        }
        break;
    }
    return error;
  };

  // 입력값 변경 처리
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 실시간 유효성 검사
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // 엔터키 처리 (다음 필드로 이동)
  const handleKeyDown = (e, fieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (fieldName === 'userId') {
        document.getElementById('password').focus();
      } else if (fieldName === 'password') {
        handleSubmit(e);
      }
    }
  };

  // 유효성 검사 함수
  const validateForm = () => {
    const newErrors = {};

    // 필수 필드 검사
    ['userId', 'password'].forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 먼저 userId로 이메일 찾기
      const { data: userInfo, error: userError } = await supabase
        .from('user_info')
        .select('email')
        .eq('user_id', formData.userId)
        .single();

      if (userError || !userInfo) {
        alert('존재하지 않는 아이디입니다.');
        return;
      }

      // 찾은 이메일로 로그인 시도
      const result = await signIn(userInfo.email, formData.password);

      if (result.success) {
        // 로그인 성공 시 메인 페이지로 이동
        navigate('/');
      }
      // 실패 시 alert는 AuthContext에서 처리
    } catch (error) {
      console.error('Login 컴포넌트 에러:', error);
      alert('로그인 처리 중 예상치 못한 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id='login-container'>
      <div className='login-wrapper'>
        <div className='login-header'>
          <h2>로그인</h2>
          <p>M-MALL에 다시 오신 것을 환영합니다.</p>
        </div>
        
        <form onSubmit={handleSubmit} className='login-form'>
          {/* 아이디 */}
          <div className='form-group'>
            <label htmlFor='userId'>아이디 *</label>
            <input
              type='text'
              id='userId'
              name='userId'
              value={formData.userId}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, 'userId')}
              placeholder='아이디를 입력해주세요'
              className={errors.userId ? 'error' : ''}
            />
            {errors.userId && <span className="error-message">{errors.userId}</span>}
          </div>

          {/* 비밀번호 */}
          <div className='form-group'>
            <label htmlFor='password'>비밀번호 *</label>
            <input
              type='password'
              id='password'
              name='password'
              value={formData.password}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, 'password')}
              placeholder='비밀번호를 입력해주세요'
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className='error-message'>{errors.password}</span>}
          </div>

          {/* 로그인 옵션 */}
          <div className='login-options'>
            <label className='remember-me'>
              <input type='checkbox' />
              <span>로그인 상태 유지</span>
            </label>
            <Link to='/forgot-password' className='forgot-password'>
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          
          {/* 로그인 버튼 */}
          <button
            type='submit'
            className='login-btn'
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className='login-footer'>
          <p>
            아직 계정이 없으신가요? 
            <Link to='/signup'> 회원가입하기</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;