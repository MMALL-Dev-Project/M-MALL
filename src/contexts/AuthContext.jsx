import { createContext, useContext, useState } from 'react';
import { supabase} from '../config/supabase';

// 사용자 정보를 저장할 전역 상자
const AuthContext = createContext()

// 다른 컴포넌트에서 상자에서 데이터 꺼내기
export const useAuth = () => {
  return useContext(AuthContext)
}

// 저장소제공자
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  //회원가입 함수
  const signUp = async (email, password, userData) => {
    // supabase에 계정 생성
    const { data, error } = await supabase.auth.signUp({
      email, password
    })
    if (error){
      alert('회원가입 실패: ' + error.message)
      return
    }

    // user_info 테이블에 추가 정보 저장
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_info')
        .insert([
          {
            id: data.user.id,
            name: userData.name,
            phone: userData.phone,
            address: userData.address || null // 주소는 선택사항
          }
        ])

      if (profileError) {
        alert('프로필 저장 실패: ' + profileError.message)
      }else {
        alert('회원가입 성공! 이메일 인증을 확인해주세요.')
      }
    }
  }

  // 로그인 함수
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
    })

    if (error) {
      alert('로그인 실패: ' + error.message)
    }else {
      setUser(data.user) // 로그인 성공하면 user 상태 업데이트
      alert('로그인 성공')
    }
  }

  // 로그아웃 함수
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null) // 로그아웃 하면 user를 null로
    alert('로그아웃')
  }

  return(
    <AuthContext.Provider value={{ user, signUp, signIn, signOut }}>
      {children} 
      {/* 이 안의 모든 컴포넌트가 user에 접근 가능 */}
    </AuthContext.Provider>
  )
}