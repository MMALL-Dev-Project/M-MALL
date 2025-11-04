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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState(null);

  // 프로필 이미지
  const getProfileImage = () => {
    const profileImg = userInfo?.profile_image;
    const DEFAULT_AVATAR = 'https://csitasavsenhjprwwdup.supabase.co/storage/v1/object/public/user-profiles/default-avatar.png';

    if (!profileImg || profileImg === 'default.jpg' || profileImg === "'default.jpg'" || profileImg.includes('default')) {
      return DEFAULT_AVATAR;
    }
    return profileImg;
  };

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setOpenMobileSubmenu(null);
  };

  const toggleMobileSubmenu = (index) => {
    setOpenMobileSubmenu(openMobileSubmenu === index ? null : index);
  };

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
    setOpenMobileSubmenu(null);
  };

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
            <NavLink to="/admin/brands" className="admin-link">브랜드 관리</NavLink>
            <NavLink to="/admin/products" className="admin-link">상품 관리</NavLink>
            <NavLink to="/admin/content" className="admin-link">컨텐츠 관리</NavLink>
            <NavLink to="/admin/categories" className="admin-link">카테고리 관리</NavLink>
          </nav>
        </div>
      )}
      <header id="header">
        {/* 햄버거 메뉴 버튼 (모바일에서만 표시) */}
        <button
          className="hamburger-btn"
          onClick={toggleMobileMenu}
          aria-label="메뉴"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

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
        {/* 모바일 사이드바 메뉴 */}
        <div className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-sidebar-header">
            <h2>MENU</h2>
            <button
              className="close-btn"
              onClick={toggleMobileMenu}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
          <nav className="mobile-nav">
            <ul className="mobile-menu-list">
              {menuData.map((menu, index) => (
                <li key={index} className={`mobile-menu-item ${menu.isSpecial ? 'special' : ''}`}>
                  <div className="mobile-menu-header">
                    <Link
                      to={`/${menu.slug}`}
                      onClick={handleMobileLinkClick}
                      className="mobile-menu-link"
                    >
                      {menu.name}
                    </Link>
                    {menu.subMenu && menu.subMenu.length > 0 && (
                      <button
                        className="submenu-toggle"
                        onClick={() => toggleMobileSubmenu(index)}
                        aria-label="서브메뉴 열기"
                      >
                        {openMobileSubmenu === index ? '−' : '+'}
                      </button>
                    )}
                  </div>
                  {/* 모바일 서브메뉴 */}
                  {menu.subMenu && menu.subMenu.length > 0 && (
                    <ul className={`mobile-submenu ${openMobileSubmenu === index ? 'open' : ''}`}>
                      {menu.subMenu.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link
                            to={`/${menu.slug}/${subItem.slug}`}
                            onClick={handleMobileLinkClick}
                          >
                            {subItem.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* 모바일 오버레이 */}
        {isMobileMenuOpen && (
          <div
            className="mobile-overlay"
            onClick={toggleMobileMenu}
          ></div>
        )}
        {/* 우측 회원 */}
        <ul className="lnb">
          <li className="tooltip-container">
            <button onClick={handleSearch} aria-label="검색">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" /></svg>
            </button>
            <span className="tooltip">검색</span>
          </li>

          {/* 관리자는 쇼핑백 x */}
          {!isAdmin && (
            <li className="tooltip-container">
              <Link to="/cart" aria-label="쇼핑백">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                  <path d="M200-80q-33 0-56.5-23.5T120-160v-480q0-33 23.5-56.5T200-720h80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720h80q33 0 56.5 23.5T840-640v480q0 33-23.5 56.5T760-80H200Zm0-80h560v-480H200v480Zm280-240q83 0 141.5-58.5T680-600h-80q0 50-35 85t-85 35q-50 0-85-35t-35-85h-80q0 83 58.5 141.5T480-400ZM360-720h240q0-50-35-85t-85-35q-50 0-85 35t-35 85ZM200-160v-480 480Z" />
                </svg>
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
                    {userInfo?.name}
                  </span>
                ) : (
                  <Link to="/mypage" aria-label="마이페이지">
                    <div className="profile-img-container">
                      <img
                        src={getProfileImage()}
                        alt="프로필"
                        className="profile-img-small"
                      />
                    </div>
                  </Link>
                )}
                <span className="tooltip">{isAdmin ? '관리자' : '마이페이지'}</span>
              </li>
              <li className="tooltip-container">
                <button onClick={handleLogout} aria-label="로그아웃">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                    <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
                  </svg>
                </button>
                <span className="tooltip">로그아웃</span>
              </li>
            </>
          ) : (
            <>
              <li className="tooltip-container">
                <Link to="/login" aria-label="로그인">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                    <path d="M480-120v-80h280v-560H480v-80h280q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H480Zm-80-160-55-58 102-102H120v-80h327L345-622l55-58 200 200-200 200Z" />
                  </svg>
                </Link>
                <span className="tooltip">로그인</span>
              </li>
              <li className="tooltip-container">
                <Link to="/signup" aria-label="회원가입">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                    <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z" />
                  </svg>
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