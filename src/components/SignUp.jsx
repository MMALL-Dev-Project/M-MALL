import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import './SignUp.css';

const SignUp = () => {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);


  // 폼 데이터
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    postcode: '', // 우편번호
    roadAddress: '', // 도로명 주소
    detailAddress: '', // 상세 주소
    birthDate: ''
  });

  // 유효성 검사 상태
  const [errors, setErrors] = useState({});

  // 중복 확인 상태
  const [checkStatus, setCheckStatus] = useState({
    userId: { checked: false, available: false },
    email: { checked: false, available: false },
    phone: { checked: false, available: false }
  });

  // 우편번호 API 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      document.head.removeChild(script);
    };
  }, []);

  // 우편번호 검색 함수
  const openPostcodeSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function(data) {
          // 선택된 주소 정보를 formData에 설정
          setFormData(prev => ({
            ...prev,
            postcode: data.zonecode, // 우편번호
            roadAddress: data.roadAddress, // 도로명 주소
            detailAddress:'' // 상세주소는 초기화
          }));

          // 상세주소 입력창에 포커스
          setTimeout(() => {
            const detailInput = document.getElementById('detailAddress');
            if (detailInput) {
              detailInput.focus();
            }
          }, 100);
        },
        // 팝업 스타일 설정
        width: '100%',
        height: '100%',
        maxSuggestItems: 5
      }).open();
    } else {
      alert('우편번호 검색 서비스를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // 🔥 실시간 유효성 검사 함수
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

      case 'email':
        if (!value) {
          error = '이메일을 입력해주세요.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = '올바른 이메일 형식이 아닙니다.';
        }
        break;

      case 'password':
        if (!value) {
          error = '비밀번호를 입력해주세요.';
        } else if (value.length < 6) {
          error = '비밀번호는 6자 이상이어야 합니다.';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          error = '비밀번호 확인을 입력해주세요.';
        } else if (formData.password !== value) {
          error = '비밀번호가 일치하지 않습니다.';
        }
        break;

      case 'name':
        if (!value) {
          error = '이름을 입력해주세요.';
        } else if (value.length < 2) {
          error = '이름은 2자 이상이어야 합니다.';
        }
        break;

      case 'phone':
        if (!value) {
          error = '전화번호를 입력해주세요.';
        } else if (!/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(value.replace(/-/g, ''))) {
          error = '올바른 전화번호 형식이 아닙니다.';
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

    // 비밀번호 확인 처리
    if (name === 'password' && formData.confirmPassword) {
      const confirmError = formData.confirmPassword !== value ? '비밀번호가 일치하지 않습니다.' : '';
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmError
      }));
    }

    // 아이디, 이메일, 전화번호 변경 시 중복 확인 상태 초기화
    if (name === 'userId' || name === 'email' || name === 'phone') {
      setCheckStatus(prev => ({
        ...prev,
        [name]: { checked: false, available: false }
      }));
    }
  };

  // 터키 처리 함수 (다음 필드로 이동 기능 추가)
  const handleKeyDown = (e, fieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 폼 제출 방지
      
      // 중복 확인이 필요한 필드들
      if (fieldName === 'userId') {
        if (!checkStatus.userId.checked) {
          // 중복 확인이 안 된 경우 중복 확인 실행
          checkUserId();
        } else {
          // 이미 중복 확인이 된 경우 다음 필드(이메일)로 이동
          document.getElementById('email').focus();
        }
      } else if (fieldName === 'email') {
        if (!checkStatus.email.checked) {
          checkEmail();
        } else {
          document.getElementById('password').focus();
        }
      } else if (fieldName === 'phone') {
        if (!checkStatus.phone.checked) {
          checkPhone();
        } else {
          openPostcodeSearch();
        }
      } else {
        // 다른 필드들은 바로 다음 필드로 이동
        const fieldOrder = ['userId', 'email', 'password', 'confirmPassword', 'name', 'phone', 'detailAddress', 'birthDate'];
        const currentIndex = fieldOrder.indexOf(fieldName);
        if (currentIndex >= 0 && currentIndex < fieldOrder.length - 1) {
          const nextField = fieldOrder[currentIndex + 1];
          document.getElementById(nextField).focus();
        }
      }
    }
  };

  // 아이디 중복 확인
  const checkUserId = async () => {
    const error = validateField('userId', formData.userId);
    if (error) {
      setErrors(prev => ({ ...prev, userId: error }));
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_info')
        .select('user_id')
        .eq('user_id', formData.userId);

      if (error) {
        setErrors(prev => ({ ...prev, userId: '중복 확인 중 오류가 발생했습니다.' }));
        return;
      }

      if (data && data.length > 0) {
        setCheckStatus(prev => ({
          ...prev,
          userId: { checked: true, available: false }
        }));
        setErrors(prev => ({ ...prev, userId: '이미 사용 중인 아이디입니다.' }));
      } else {
        setCheckStatus(prev => ({
          ...prev,
          userId: { checked: true, available: true }
        }));
        setErrors(prev => ({ ...prev, userId: '' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, userId: '중복 확인 중 오류가 발생했습니다.' }));
    }
  };

  // 이메일 중복 확인
  const checkEmail = async () => {
    const error = validateField('email', formData.email);
    if (error) {
      setErrors(prev => ({ ...prev, email: error }));
      return;
    }
    
    try {      
      const { data, error } = await supabase
        .from('user_info')
        .select('email')
        .eq('email', formData.email);

      if (error) {
        setErrors(prev => ({ ...prev, email: '중복 확인 중 오류가 발생했습니다.' }));
        return;
      }

      if (data && data.length > 0) {
        setCheckStatus(prev => ({
          ...prev,
          email: { checked: true, available: false }
        }));
        setErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일입니다.' }));
      } else {
        setCheckStatus(prev => ({
          ...prev,
          email: { checked: true, available: true }
        }));
        setErrors(prev => ({ ...prev, email: '' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, email: '중복 확인 중 오류가 발생했습니다.' }));
    }
  };

  // 전화번호 중복 확인
  const checkPhone = async () => {
    const error = validateField('phone', formData.phone);
    if (error) {
      setErrors(prev => ({ ...prev, phone: error }));
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_info')
        .select('phone')
        .eq('phone', formData.phone);

      if (error) {
        setErrors(prev => ({ ...prev, phone: '중복 확인 중 오류가 발생했습니다.' }));
        return;
      }

      if (data && data.length > 0) {
        setCheckStatus(prev => ({
          ...prev,
          phone: { checked: true, available: false }
        }));
        setErrors(prev => ({ ...prev, phone: '이미 가입된 전화번호입니다.' }));
      } else {
        setCheckStatus(prev => ({
          ...prev,
          phone: { checked: true, available: true }
        }));
        setErrors(prev => ({ ...prev, phone: '' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, phone: '중복 확인 중 오류가 발생했습니다.' }));
    }
  };

  // 유효성 검사 함수
  const validateForm = () => {
    const newErrors = {};

    // 필수 필드 검사
    ['userId', 'email', 'password', 'confirmPassword', 'name', 'phone'].forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    // 중복 확인 검사
    if (!checkStatus.userId.checked || !checkStatus.userId.available) {
      newErrors.userId = '아이디 중복 확인을 해주세요.';
    }
    if (!checkStatus.email.checked || !checkStatus.email.available) {
      newErrors.email = '이메일 중복 확인을 해주세요.';
    }
    if (!checkStatus.phone.checked || !checkStatus.phone.available) {
      newErrors.phone = '전화번호 중복 확인을 해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 // 폼 제출 처리 (콘솔 로그 제거, AuthContext에서 처리)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 전체 주소 합치기
      const fullAddress = `${formData.roadAddress} ${formData.detailAddress}`.trim();
      
      const result = await signUp(formData.email, formData.password, {
        user_id: formData.userId,
        name: formData.name,
        phone: formData.phone,
        address: fullAddress || null, // 전체 주소
        birth_date: formData.birthDate || null
      });

      if (result.success) {
        // 성공 시 폼 리셋 (AuthContext에서 alert 처리)
        setFormData({
          userId: '',
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          phone: '',
          postcode: '',
          roadAddress: '',
          detailAddress: '',
          birthDate: ''
        });
        setCheckStatus({
          userId: { checked: false, available: false },
          email: { checked: false, available: false },
          phone: { checked: false, available: false }
        });
        setErrors({});
      }
      // 실패 시 alert도 AuthContext에서 처리
    } catch (error) {
      // 예외 발생 시에만 SignUp에서 처리
      console.error('SignUp 컴포넌트 에러:', error);
      alert('회원가입 처리 중 예상치 못한 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id='signup-container'>
      <div className='signup-wrapper'>
        <div className='signup-header'>
          <h2>회원가입</h2>
          <p>M-MALL에 오신 것을 환영합니다.</p>
        </div>
        <form onSubmit={handleSubmit} className='signup-form'>
          {/* 아이디 */}
          <div className='form-group'>
            <label htmlFor='userId'>아이디 *</label>
            <div className='input-btn'>
              <input 
                type='text'
                id='userId'
                name='userId'
                value={formData.userId}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, 'userId')}
                placeholder='영문, 숫자, 4자 이상'
                className={errors.userId ? 'error' : checkStatus.userId.available ? 'success' : ''}
              />
              <button
                type='button'
                onClick={checkUserId}
                className='check-btn'
                disabled={!formData.userId || formData.userId.length < 4}
              >
                중복확인
              </button>
            </div>
            {errors.userId && <span className="error-message">{errors.userId}</span>}
            {checkStatus.userId.checked && checkStatus.userId.available && (
              <span className="success-message">사용 가능한 아이디입니다.</span>
            )}
          </div>

          {/* 이메일 */}
          <div className='form-group'>
            <label htmlFor='email'>이메일 *</label>
            <div className='input-btn'>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, 'email')}
                placeholder='example@email.com'
                className={errors.email ? 'error' : checkStatus.email.available ? 'success' : ''}
              />
              <button
                type='button'
                onClick={checkEmail}
                className='check-btn'
                disabled={!formData.email}
              >
                중복확인
              </button>
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
            {checkStatus.email.checked && checkStatus.email.available && (
              <span className="success-message">사용 가능한 이메일입니다.</span>
            )}
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
              placeholder='6자 이상 입력해주세요'
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className='error-message'>{errors.password}</span>}
          </div>
          
          {/* 비밀번호 확인 */}
          <div className='form-group'>
            <label htmlFor='confirmPassword'>비밀번호 확인 *</label>
            <input
              type='password'
              id='confirmPassword'
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, 'confirmPassword')}
              placeholder='비밀번호를 다시 입력해주세요'
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className='error-message'>{errors.confirmPassword}</span>}
          </div>

          {/* 이름 */}
          <div className='form-group'>
            <label htmlFor='name'>이름 *</label>
            <input
              type='text'
              id='name'
              name='name'
              value={formData.name}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, 'name')}
              placeholder='이름을 입력해주세요'
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className='error-message'>{errors.name}</span>}
          </div>

          {/* 전화번호 */}
          <div className='form-group'>
            <label htmlFor='phone'>전화번호 *</label>
            <div className='input-btn'>
              <input
                type='tel'
                id='phone'
                name='phone'
                value={formData.phone}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, 'phone')}
                placeholder='010-1234-5678'
                className={errors.phone ? 'error' : checkStatus.phone.available ? 'success' : ''}
              />
              <button
                type='button'
                onClick={checkPhone}
                className='check-btn'
                disabled={!formData.phone}
              >
                중복확인
              </button>
            </div>
            {errors.phone && <span className='error-message'>{errors.phone}</span>}
            {checkStatus.phone.checked && checkStatus.phone.available && (
              <span className='success-message'>사용 가능한 전화번호입니다.</span>
            )}
          </div>
          
          {/* 주소(선택) (우편번호 + 도로명주소 + 상세주소) */}
          <div className='form-group'>
            <label htmlFor='postcode'>주소</label>
            {/* 우편번호 + 검색버튼*/}
            <div className='input-btn' style={{ marginBottom: '10px' }}>
              <input
                type='text'
                id='postcode'
                name='postcode'
                value={formData.postcode}
                placeholder='우편번호'
                readOnly
                style={{ backgroundColor: '#f5f5f5' }}
              />
              <button
                type='button'
                onClick={openPostcodeSearch}
                className='check-btn'
                style={{ whiteSpace: 'nowrap' }}
              >
                우편번호 찾기
              </button>
            </div>

            {/* 도로명 주소 */}
            <input
              type='text'
              id='address'
              name='roadAddress'
              value={formData.roadAddress}
              placeholder='도로명 주소'
              readOnly
              style={{ 
                width: '100%', 
                marginBottom: '10px',
                backgroundColor: '#f5f5f5'
              }}
            />

            {/* 상세 주소 */}
            <input
              type='text'
              id='detailAddress'
              name='detailAddress'
              value={formData.detailAddress}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, 'detailAddress')}
              placeholder='상세주소를 입력해주세요'
              style={{ width: '100%' }}
            />
          </div>

          {/* 생년월일(선택) */}
          <div className='form-group'>
            <label htmlFor='birthDate'>생년월일</label>
            <input
              type='date'
              id='birthDate'
              name='birthDate'
              value={formData.birthDate}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, 'birthDate')}
            />
          </div>
          
          {/* 제출 */}
          <button
            type='submit'
            className='signup-btn'
            disabled={loading}
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
        
        <div className='signup-footer'>
          <p>
            이미 계정이 있으신가요? 
            <Link to='/login'> 로그인하기</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;