import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";
import './Header.css';

const Header = () => {
  const { user, userInfo, signOut } = useAuth();
  const navigate = useNavigate();
  const [hoveredMenu, setHoveredMenu] = useState(null);

  const menuData = [
    {
      name: '추천상품',
      link: '/recommended',
      subMenu: []
    },
    {
      name: '패션·뷰티',
      link: '/fashion-beauty',
      subMenu: ['전체', '의류', '가방·신발', '액세서리', '주얼리', '키즈', '메이크업', '헤어·바디', '프레그런스']
    },
    {
      name: '리빙',
      link: '/living',
      subMenu: ['전체', '조명', '가구', '홈데코', '키친', '다이닝', '생활용품']
    },
    {
      name: '테크',
      link: '/tech',
      subMenu: ['전체', '디지털', '영상·음향', '주방가전', '생활가전', '뷰티기기']
    },
    {
      name: '스포츠·레저',
      link: '/sports',
      subMenu: ['전체', '골프', '캠핑', '등산', '피트니스']
    },
    {
      name: '컬처',
      link: '/culture',
      subMenu: ['전체', '바이닐', '해외도서 큐레이션', '국내도서 스테디셀러', '아트샵', '취미']
    },
    {
      name: '편집샵',
      link: '/select-shop',
      subMenu: []
    },
    {
      name: '호텔·고메',
      link: '/hotel-gourmet',
      subMenu: ['전체', '스테이', '스파', '고메']
    },
    {
      name: '모바일 이용권',
      link: '/mobile',
      subMenu: [],
      isSpecial: true
    },
    {
      name: '현대카드',
      link: '/hyundai-card',
      subMenu: [],
      isSpecial: true
    }
  ];

  const handleMenuHover = (index) => {
    setHoveredMenu(index);
  };

  const handleMenuLeave = () => {
    setHoveredMenu(null);
  };

  const handleSearch = () => {
    // 검색 모달 열기 또는 검색 페이지로 이동
    console.log('검색 버튼 클릭');
  };

  const handleLogin = () => {
    // 로그인 페이지로 이동
    console.log('로그인 버튼 클릭');
    navigate('/login');
  };

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      alert('로그아웃 되었습니다.');
    }
  };

  return (
    <header id="header">
      <h1 className="logo">
        <Link to="/">
          <img src={`${import.meta.env.BASE_URL}images/logo.svg`} alt="M-MALL" />
        </Link>
      </h1>
      <nav
        className="nav"
        onMouseLeave={handleMenuLeave}
      >
        <ul className="gnb">
          {menuData.map((menu, index) =>
            <li
              key={index}
              className={`gnb-item ${menu.isSpecial ? 'special' : ''}`}
              onMouseEnter={() => handleMenuHover(index)}
            >
              <Link
                to={menu.link}
                className={`gnb-link ${hoveredMenu === index ? 'hovered' : ''}`}
              >
                {menu.name}
              </Link>
              {/* 서브메뉴 */}
              {menu.subMenu.length > 0 && (
                <ul
                  className={`sub-menu ${hoveredMenu === index ? 'visible' : ''}`}
                >
                  {menu.subMenu.map((subItem, subIndex) => (
                    <li key={subIndex}>
                      <Link to={`${menu.link}/${encodeURIComponent(subItem.toLowerCase().replace(/[·\s]/g, '-'))}`}>
                        {subItem}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )}
        </ul>
        {/* 서브메뉴 배경 */}
        <div className={`sub-bg ${hoveredMenu !== null ? 'visible' : ''}`}></div>
      </nav>
      {/* 우측 회원 */}
      <ul className="lnb">
        <li>
          <button onClick={handleSearch} aria-label="검색">
            <img src="/M-MALL/images/icons/ico_search.png" alt="검색" />
          </button>
        </li>
        <li>
          <Link to="/mypage" aria-label="마이페이지">
            <img src="/M-MALL/images/icons/ico_user.png" alt="마이페이지" />
          </Link>
        </li>
        <li>
          <Link to="/cart" aria-label="쇼핑백">
            <img src="/M-MALL/images/icons/ico_bag.png" alt="쇼핑백" />
          </Link>
        </li>

        {/* 로그인 상태에 따른 조건부 렌더링 */}
        {user ? (
          // 로그인된 상태
          <>
            <li>
              <span className="user-greeting">
                {userInfo?.name}님
              </span>
            </li>
            <li>
              <button onClick={handleLogout} aria-label="로그아웃">
                <img src="/M-MALL/images/icons/ico_logout.png" alt="로그아웃" />
              </button>
            </li>
          </>
        ) : (
          // 로그아웃된 상태
          <>
            <li>
              <Link to="/login" aria-label="로그인">
                <img src="/M-MALL/images/icons/ico_login.png" alt="로그인" />
              </Link>
            </li>
            <li>
              <Link to="/signup" aria-label="회원가입">
                <img src="/M-MALL/images/icons/ico_signup.png" alt="회원가입" />
              </Link>
            </li>
          </>
        )}
      </ul>
    </header>
  )
};

export default Header;