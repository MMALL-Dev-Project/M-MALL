import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext()

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        // 세션 확인
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data, error } = await supabase
            .from('user_info')
            .select('name, points_balance, role, profile_image, notification_settings')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('사용자 정보 조회 에러:', error)
            setUserInfo(null)
          } else {
            setUserInfo(data)
          }
        } else {
          setUserInfo(null)
        }
      } catch (error) {
        console.error('세션 조회 에러:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          fetchUserInfo(session.user.id)
        } else {
          setUserInfo(null)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
  //회원가입
  const signUp = async (email, password, userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback`,
          data: {
            // 트리거에서 사용할 데이터를 user_metadata에 저장
            user_id: userData.user_id,
            name: userData.name,
            phone: userData.phone,
            address: userData.address || null,
            birth_date: userData.birth_date || null,
          }
        }
      });

      if (error) {
        alert('회원가입 실패: ' + error.message);
        return { success: false, error };
      }

      alert('이메일을 확인하고, 인증 링크를 클릭해주세요!');
      return { success: true, data };

    } catch (error) {
      console.error('회원가입 에러:', error);
      alert('회원가입 중 오류가 발생했습니다.');
      return { success: false, error };
    }
  }

  // 로그인
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email, password
      })

      if (error) {
        alert('로그인 실패: ' + error.message)
        return { success: false, error }
      }

      alert('로그인 성공')
      return { success: true, data }
    } catch (error) {
      console.error('로그인 에러:', error)
      alert('로그인 중 오류가 발생했습니다.')
      return { success: false, error }
    }
  }

  // 로그아웃
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        alert('로그아웃 실패: ' + error.message)
        return { success: false, error }
      }
      return { success: true }
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
    fetchUserInfo
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export default AuthProvider;