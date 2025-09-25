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
  const [userInfo, setUserInfo] = useState(null) // 사용자 정보 상태
  const [loading, setLoading] = useState(true)

  console.log('AuthProvider 렌더링 - loading:', loading)
  console.log('현재 환경:', {
     origin: window.location.origin,
     supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
     production: import.meta.env.PROD
   });

  // 인증 상태 변화 감지 추가
  useEffect(() => {
    console.log('useEffect 시작')
    const getSession = async () => {
      try {
        console.log('세션 및 사용자 정보 조회 시작')

        // 1. 세션 확인
        const { data: { session } } = await supabase.auth.getSession()
        console.log('세션 결과:', session)

        setUser(session?.user ?? null)

        // 2. 로그인 상태면 user_info도 가져오기
        if (session?.user) {
          console.log('사용자 정보 조회 시작 - userId:', session.user.id)

          //await fetchUserInfo(session.user.id)
          const { data, error } = await supabase
            .from('user_info')
            .select('name, points_balance, role, profile_image, notification_settings')
            .eq('id', session.user.id) // UUID로 조회
            .single()

          if (error) {
            console.error('사용자 정보 조회 에러:', error)
            setUserInfo(null)
          } else {
            console.log('사용자 정보 조회 성공:', data)
            setUserInfo(data)

          }
        } else {
          console.log('로그인 상태 아님 - userInfo null로 설정')
          setUserInfo(null)
        }
      } catch (error) {
        console.error('getSessionAndUser 에러:', error)
      } finally {
        // 3. 성공/실패 관계없이 loading 완료
        console.log('모든 작업 완료 - loading을 false로 설정')
        setLoading(false)
      }
    }
    getSession() // 즉시 실행

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('인증 상태 변화:', _event, session?.user?.email)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('로그인 감지 - fetchUserInfo 호출')
          fetchUserInfo(session.user.id)
        } else {
          setUserInfo(null)
        }

        setLoading(false)
      }
    )



    return () => {
      console.log('subscription 해제')
      subscription.unsubscribe()
    }
  }, [])

  // user_id로 user_info 테이블에서 사용자 정보 가져오기
  const fetchUserInfo = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_info')
        .select('name, points_balance, role, profile_image, notification_settings')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('사용자 정보 조회 에러:', error)
        return
      }
      setUserInfo(data)
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error)
    }
  }
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
        birth_date: userData.birth_date || null,
        // 테이블 수정 후 추가한 필드
        profile_image: 'default.png',
        points_balance: 0,
        role: 'user',
        //테이블에 DEFAULT 값이 있지만, 명시적으로 값을 넣지 않으면 INSERT 시 문제가 생길 수 있음
        // 테이블에서 not null()
        notification_settings: {
          "shipping": true, //  배송 관련 알림
          "marketing": false, // 광고 알링
          "order_status": true, // 주문 상태 알림
          "product_restock": true, // 상품 재입고 알림
          "product_discount": true // 상품 할인 알림
        }
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
        return { success: false, error }
      } else {
        return { success: true }
      }
    } catch (error) {
      console.error('로그아웃 에러:', error)
      alert('로그아웃 중 오류가 발생했습니다.')
      return { success: false, error }
    }
  }

  const value = {
    user,
    userInfo,
    loading,
    signUp,
    signIn,
    signOut,
    fetchUserInfo // 다름 컴포넌트에서 정보 갱신 필요할 때 사용
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {/* 로딩이 완료된 후에만 자식 컴포넌트 렌더링 */}
    </AuthContext.Provider>
  )
}

export default AuthProvider;