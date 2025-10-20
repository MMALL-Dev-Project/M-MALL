import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"
import { useRef } from "react";

// 관리자 권한 체크 - 강제 리다이텍트
export const useAdminAuth = (callbacks = [], deps = []) => {
    const { user, userInfo } = useAuth();
    const navigate = useNavigate();
    const didRun = useRef(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // userInfo가 아직 로드되지 않은 경우 기다림
        if (!userInfo) {
            return;
        }

        // 관리자가 아니면 접근 거부
        if (userInfo.role !== 'admin') {
            alert('관리자만 접근할 수 있습니다.');
            navigate('/');
            return;
        }

        // 이미 실행한 적 있으면 다시 안 함
        if (didRun.current) return;
        didRun.current = true;

        // 권한 체크 후 콜백함수 실행 (배열이면 순차 진행)
        if (Array.isArray(callbacks)) {
            callbacks.forEach(callback => {
                if (callback) callback();
            })
        } else if (callbacks) {
            callbacks();
        }


    }, [user, userInfo, ...deps]);

    return { user, userInfo };
}

// 관리자 권한 체크 - boolean 값 반환 
export const useCheckAdmin = () => {
    const { user, userInfo } = useAuth();

    if (user === undefined || userInfo === undefined) {
        return;
    }
    // user와 userInfo가 모두 있고, role이 admin인 경우에만 true
    const isAdmin = user && userInfo && userInfo.role === 'admin';

    return isAdmin;
}

