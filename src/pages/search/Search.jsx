import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import ProductCard from '../../components/products/ProductCard.jsx';
import './Search.css';

const Search = () => {
  const [searchValue, setSearchValue] = useState('');
  const [placeholder, setPlaceholder] = useState('검색어를 입력하세요');
  const [activeTab, setActiveTab] = useState('product');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({
    products: [],
    brands: [],
    events: [],
    contents: [],
    lookbooks: []
  });
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const getBrandBasedPlaceholder = () => { // 아직은 안씀 나중에 관리자 페이지 할 때 수정할 예정
    const now = new Date();
    const month = now.getMonth() + 1;

    if (month >= 9 || month <= 2) {
      const fallWinterTexts = [
        '다이슨 25FW 신상품 출시',
        '발뮤다 겨울 컬렉션 특가',
        '폴로 히트텍 시즌 SALE',
        '라코스테 가을 신상품',
        '설화수 겨울 스킨케어 세트',
        '헤라 홀리데이 에디션',
        '에스티로더 윈터 컬렉션',
        '이니스프리 겨울 한정판',
        '키엘 보습 라인 특가',
        '아이오페 겨울 케어 세트'
      ];
      return fallWinterTexts[Math.floor(Math.random() * fallWinterTexts.length)];
    }

    const springSummerTexts = [
      '디즈니 여름 한정판 출시',
      '마블 스페셜 에디션',
      '레고 신제품 컬렉션',
      '킨키로봇 피규어 할인',
      '라코스테 25SS 컬렉션',
      '폴로 여름 신상품 론칭',
      '다이슨 에어컨 시리즈',
      '발뮤다 여름 가전 특가',
      '이니스프리 선케어 라인',
      '헤라 여름 메이크업',
      '설화수 여름 케어 세트',
      '키엘 자외선 차단 제품',
      '에스티로더 썸머 에디션',
      '아이오페 쿨링 라인'
    ];
    return springSummerTexts[Math.floor(Math.random() * springSummerTexts.length)];
  };

  const getWeeklySpecialPlaceholder = () => {
    const day = new Date().getDay();

    if (day === 1) {
      const mondayTexts = [
        '새 한주 시작! 발뮤다 주간 특가',
        '월요일 론칭! 폴로 신상품',
        '주간 베스트 브랜드 모음전'
      ];
      return mondayTexts[Math.floor(Math.random() * mondayTexts.length)];
    }

    if (day === 5) {
      const fridayTexts = [
        '불금 특가! 다이슨 위크엔드 세일',
        '주말 준비! 라코스테 컬렉션',
        '위크엔드 쇼핑! 설화수 스페셜'
      ];
      return fridayTexts[Math.floor(Math.random() * fridayTexts.length)];
    }

    const categoryTexts = [
      '설화수 프리미엄 케어 라인',
      '헤라 신상품 출시 기념',
      '에스티로더 베스트셀러',
      '이니스프리 자연주의 스킨케어',
      '키엘 전문가 추천',
      '아이오페 과학적 뷰티',
      '발뮤다 프리미엄 가전',
      '다이슨 혁신 기술',
      '루이스폴센 디자인 조명',
      '뱅앤올룹슨 프리미엄 오디오',
      '보스 사운드 시스템',
      '로지텍 게이밍 기어',
      '폴로 클래식 컬렉션',
      '라코스테 스포츠 라인',
      '언더아머 퍼포먼스 웨어',
      '호카 러닝화 신상품',
      '디즈니 캐릭터 굿즈',
      '마블 한정 에디션',
      '레고 신제품 출시',
      '킨키로봇 피규어 컬렉션'
    ];

    return categoryTexts[Math.floor(Math.random() * categoryTexts.length)];
  };

  useEffect(() => {
    setPlaceholder(getWeeklySpecialPlaceholder());

    const query = searchParams.get('q');
    if (query) {
      setSearchValue(query);
      setIsSearching(true);
      performSearch(query);
    } else {
      setIsSearching(false);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setIsSearching(true);
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setIsSearching(false);
    setSearchResults({
      products: [],
      brands: [],
      events: [],
      contents: [],
      lookbooks: []
    });
    navigate('/search');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const performSearch = async (query) => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      // 상품 검색
      const { data: productData } = await supabase
        .from('products')
        .select(`
          pid, name, price, thumbnail_url, bid,
          is_soldout, point_rate,
          brands(bid, name)
        `)
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(20);

      // 브랜드 검색
      const { data: brandData } = await supabase
        .from('brands')
        .select('bid, name, logo_url')
        .ilike('name', `%${query}%`)
        .eq('is_active', true);

      setSearchResults({
        products: productData || [],
        brands: brandData || [],
        events: [],
        contents: [],
        lookbooks: []
      });

      setActiveTab('product'); // 검색 후 상품 탭으로 이동

    } catch (error) {
      console.error('검색 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <div className="search-container">
      {/* 검색 입력창 */}
      <div className="search-input-section">
        <form onSubmit={handleSearch}>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button 
            type={isSearching ? "button" : "submit"} 
            className="search-button"
            onClick={isSearching ? handleClearSearch : undefined}
          >
            <span className="material-symbols-outlined">
              {isSearching ? 'close' : 'search'}
            </span>
          </button>
        </form>
      </div>

      <div className="search-content">
        {loading && <p>검색 중...</p>}

        {searchParams.get('q') && (
          <>
            {/* 탭 UI 추가 */}
            <div className="search-tabs">
              <button 
                className={`tab ${activeTab === 'product' ? 'active' : ''}`}
                onClick={() => handleTabClick('product')}
              >
                PRODUCT ({searchResults.products.length})
              </button>
              <button 
                className={`tab ${activeTab === 'brand' ? 'active' : ''}`}
                onClick={() => handleTabClick('brand')}
              >
                BRAND ({searchResults.brands.length})
              </button>
              <button 
                className={`tab ${activeTab === 'event' ? 'active' : ''}`}
                onClick={() => handleTabClick('event')}
              >
                EVENT ({searchResults.events.length})
              </button>
              <button 
                className={`tab ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => handleTabClick('content')}
              >
                CONTENT ({searchResults.contents.length})
              </button>
              <button 
                className={`tab ${activeTab === 'lookbook' ? 'active' : ''}`}
                onClick={() => handleTabClick('lookbook')}
              >
                LOOKBOOK ({searchResults.lookbooks.length})
              </button>
            </div>

            {/* 탭별 결과 표시 */}
            <div className="tab-content">
              {activeTab === 'product' && (
                <div className="product-results">
                  {searchResults.products.length > 0 ? (
                    <ul className="product-list">
                      {searchResults.products.map(product => (
                        <ProductCard key={product.pid} product={product} />
                      ))}
                    </ul>
                  ) : (
                    <p>상품 검색 결과가 없습니다.</p>
                  )}
                </div>
              )}

              {activeTab === 'brand' && (
                <div className="brand-results">
                  {searchResults.brands.length > 0 ? (
                    <div className="brand-grid">
                      {searchResults.brands.map(brand => (
                        <div key={brand.bid} className="brand-item">
                          {brand.logo_url && (
                            <img src={brand.logo_url} alt={brand.name} className="brand-logo" />
                          )}
                          <h3>{brand.name}</h3>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>브랜드 검색 결과가 없습니다.</p>
                  )}
                </div>
              )}

              {activeTab === 'event' && (
                <div className="event-results">
                  <p>이벤트 기능은 준비 중입니다.</p>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="content-results">
                  <p>콘텐츠 기능은 준비 중입니다.</p>
                </div>
              )}

              {activeTab === 'lookbook' && (
                <div className="lookbook-results">
                  <p>룩북 기능은 준비 중입니다.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Search;