import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import './Header.css';
import { supabase } from "../../config/supabase";

const Header = () => {
  const { user, userInfo, signOut } = useAuth();

  // 관리자
  const isAdmin = userInfo?.role === 'admin';

  const navigate = useNavigate();
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [menuData, setMenuData] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select(`
            name, slug, display_order,
            sub_categories(name, slug, display_order)
          `)
          .order('display_order');

        if (error) {
          console.error('카테고리 조회 에러:', error);
          return;
        }

        // DB 데이터를 컴포넌트 형식으로 변환
        const formattedData = data.map(category => ({
          name: category.name,
          slug: category.slug,
          subMenu: category.sub_categories
            ? [...category.sub_categories].sort((a, b) => a.display_order - b.display_order)
            : [],
          isSpecial: ['mobile', 'hyundai-card'].includes(category.slug)
        }));
        setMenuData(formattedData);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleMenuHover = (index) => {
    setHoveredMenu(index);
  };

  const handleMenuLeave = () => {
    setHoveredMenu(null);
  };

  const handleSearch = () => {
    navigate('/search');
  };

  const handleLogin = () => {
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
    <div id="header-wrap" className={isAdmin ? 'has-admin-bar' : ''}>
      {/* 관리자 전용 상단 바 */}
      {userInfo && isAdmin && (
        <div className="admin-bar">
          <nav className="admin-nav">
            <NavLink to="/admin/users" className="admin-link">회원 관리</NavLink>
            <NavLink to="/support/inquiries" className="admin-link">문의 관리</NavLink>
            <NavLink to="/admin/ordermanagement" className="admin-link">주문 관리</NavLink>
            <NavLink to="/admin/products" className="admin-link">상품 관리</NavLink>
          </nav>
        </div>
      )}
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
                  to={`/${menu.slug}`}
                  className={`gnb-link ${hoveredMenu === index ? 'hovered' : ''}`}
                >
                  {menu.name}
                </Link>
                {/* 서브메뉴 */}
                {menu.subMenu && menu.subMenu.length > 0 && (
                  <ul
                    className={`sub-menu ${hoveredMenu === index ? 'visible' : ''}`}
                  >
                    {menu.subMenu.map((subItem, subIndex) => (
                      <li key={subIndex}>
                        <Link to={`/${menu.slug}/${subItem.slug}`}>
                          {subItem.name}
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
          <li className="tooltip-container">
            <button onClick={handleSearch} aria-label="검색">
              <img src={`${import.meta.env.BASE_URL}images/icons/ico_search.png`} alt="검색" />
            </button>
            <span className="tooltip">검색</span>
          </li>

          {/* 관리자는 쇼핑백 x */}
          {!isAdmin && (
            <li className="tooltip-container">
              <Link to="/cart" aria-label="쇼핑백">
                <img src={`${import.meta.env.BASE_URL}images/icons/ico_bag.png`} alt="쇼핑백" />
              </Link>
              <span className="tooltip">쇼핑백</span>
            </li>
          )}
          {user ? (
            <>
              <li className="tooltip-container">
                {/* 관리자는 마이페이지 x */}
                {isAdmin ? (
                  <span className="user-greeting admin-name">
                    {userInfo?.name}<span></span>
                  </span>
                ) : (
                  <Link to="/mypage" className="user-greeting" aria-label="마이페이지">
                    {userInfo?.name}<span>님</span>
                  </Link>
                )}
                <span className="tooltip">{isAdmin ? '관리자' : '마이페이지'}</span>
              </li>
              <li className="tooltip-container">
                <button onClick={handleLogout} aria-label="로그아웃">
                  <img src={`${import.meta.env.BASE_URL}images/icons/ico_logout.png`} alt="로그아웃" />
                </button>
                <span className="tooltip">로그아웃</span>
              </li>
            </>
          ) : (
            <>
              <li className="tooltip-container">
                <Link to="/login" aria-label="로그인">
                  <img src={`${import.meta.env.BASE_URL}images/icons/ico_login.png`} alt="로그인" />
                </Link>
                <span className="tooltip">로그인</span>
              </li>
              <li className="tooltip-container">
                <Link to="/signup" aria-label="회원가입">
                  <img src={`${import.meta.env.BASE_URL}images/icons/ico_signup.png`} alt="회원가입" />
                </Link>
                <span className="tooltip">회원가입</span>
              </li>
            </>
          )}
        </ul>
      </header>
    </div>
  );
};

export default Header;