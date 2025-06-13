import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

// 사용자 정보를 저장할 전역 상자
const AuthContext = createContext()

// 다른 컴포넌트에서 상자에서 데이터 꺼내기
export const useAuth = () => {
  return useContext(AuthContext)
}

// 저장소제공자
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔥 인증 상태 변화 감지 추가
  useEffect(() => {
    // 현재 세션 확인
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('세션 확인 에러:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('인증 상태 변화:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  //회원가입 함수
  const signUp = async (email, password, userData) => {
     try {
    console.log('회원가입 시도:', { email, userData });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      alert('회원가입 실패: ' + error.message);
      return { success: false, error };
    }

    // INSERT 대신, 로컬에 pendingProfile만 저장
    const profileData = {
      id: data.user.id,
      user_id: userData.user_id,
      email,
      name: userData.name,
      phone: userData.phone,
      address: userData.address || null,
      birth_date: userData.birth_date || null
    };
    localStorage.setItem('pendingProfile', JSON.stringify(profileData));

    alert('이메일을 확인하고, 인증 링크를 클릭해야 회원가입이 완료됩니다!');
    return { success: true, data };
  } catch (error) {
    console.error('회원가입 에러:', error);
    alert('회원가입 중 오류가 발생했습니다.');
    return { success: false, error };
  }
  }

  // 로그인 함수
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email, password
      })

      if (error) {
        alert('로그인 실패: ' + error.message)
        return { success: false, error }
      } else {
        // setUser는 onAuthStateChange에서 자동으로 처리됨
        alert('로그인 성공')
        return { success: true, data }
      }
    } catch (error) {
      console.error('로그인 에러:', error)
      alert('로그인 중 오류가 발생했습니다.')
      return { success: false, error }
    }
  }

  // 로그아웃 함수
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        alert('로그아웃 실패: ' + error.message)
      } else {
        alert('로그아웃 되었습니다.')
      }
    } catch (error) {
      console.error('로그아웃 에러:', error)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut
  }

  return(
    <AuthContext.Provider value={value}>
      {!loading && children} 
      {/* 로딩이 완료된 후에만 자식 컴포넌트 렌더링 */}
    </AuthContext.Provider>
  )
}

export default AuthProvider