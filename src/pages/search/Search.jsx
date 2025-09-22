import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import './Search.css';

const Search = () => {
  const [searchValue, setSearchValue] = useState('');  // 검색어 상태
  const [searchResults, setSearchResults] = useState({
    products: [], // 검색된 상품들
    brands: [], // 검색된 브랜드들
    totalCount: 0 // 총 검색 결과 수  
  });
  const [loading, setLoading] = useState(false); // 검색 중인지 여부를 저장하는 상태 (로딩 스피너 사용)
  const [searchParams] = useSearchParams(); // URL 쿼리 파라미터 접근(?q=검색어)
  const navigate = useNavigate(); // 페이지 이동

  const inputRef = useRef(null); // 검색창 자동 포커스용 ref

  useEffect(() => { // URL 쿼리 파라미터가 바뀔 때마다 검색 수행
    const query = searchParams.get('q');
    if (query) {
      setSearchValue(query); //
      performSearch(query);
    }
    // 페이지 로드 시 검색창 자동 포커스
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    }
  };
  // 실제 검색 함수 (일단 비워둠)
 const performSearch = async (query) => {
  if (!query.trim()) return;
  
  console.log('검색어:', query);
  setLoading(true);
  
  try {
    // 1. 브랜드 검색
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select('bid, name, logo_url')
      .ilike('name', `%${query}%`)
      .eq('is_active', true);
    
    console.log('브랜드 검색 결과:', brandData);
    if (brandError) console.error('브랜드 검색 에러:', brandError);

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('pid, name, price, thumbnail_url, bid')  // description 제거
      .ilike('name', `%${query}%`)  // name만 검색
      .eq('is_active', true)
      .limit(20);

    console.log('상품 검색 결과:', productData);
    if (productError) console.error('상품 검색 에러:', productError);

    // 3. 결과 설정
    setSearchResults({
      products: productData || [],
      brands: brandData || [],
      totalCount: (productData?.length || 0) + (brandData?.length || 0)
    });

  } catch (error) {
    console.error('검색 중 오류:', error);
  } finally {
    setLoading(false);
  }
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
          placeholder="매일 바뀌는 문구"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <button type="submit" className="search-button">
          🔍
        </button>
      </form>
    </div>

    <div className="search-content">
      {loading && <p>검색 중...</p>}
      
      {searchResults.totalCount > 0 && (
        <div className="search-results">
          <h2>검색 결과 ({searchResults.totalCount}개)</h2>
          
          {/* 브랜드 결과 */}
          {searchResults.brands.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3>브랜드 ({searchResults.brands.length})</h3>
              {searchResults.brands.map(brand => (
                <div key={brand.bid} style={{ 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  margin: '10px 0',
                  cursor: 'pointer'
                }}>
                  <strong>{brand.name}</strong>
                  {brand.logo_url && <img src={brand.logo_url} alt={brand.name} style={{ width: '50px', marginLeft: '10px' }} />}
                </div>
              ))}
            </div>
          )}
          
          {/* 상품 결과 */}
          {searchResults.products.length > 0 && (
            <div>
              <h3>상품 ({searchResults.products.length})</h3>
              {searchResults.products.map(product => (
                <div key={product.pid} style={{ 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  margin: '10px 0',
                  display: 'flex',
                  gap: '10px'
                }}>
                  {product.thumbnail_url && <img src={product.thumbnail_url} alt={product.name} style={{ width: '100px' }} />}
                  <div>
                    <h4>{product.name}</h4>
                    <p>{product.price?.toLocaleString()}원</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {searchParams.get('q') && searchResults.totalCount === 0 && !loading && (
        <p>"{searchParams.get('q')}" 검색 결과가 없습니다.</p>
      )}
    </div>
  </div>
);
};

export default Search;