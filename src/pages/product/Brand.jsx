import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@config/supabase';
import { getLogoSrc } from '@/utils/image';
import { useLike } from '@hooks/useLike';
import { useCheckAdmin } from '@hooks/useAdminAuth';
import ProductList from '@components/products/ProductList';
import './Brand.css';


const Brand = () => {
  // URL 파라미터에서 브랜드 bid 추출
  const { bid } = useParams();
  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = useCheckAdmin();


  // 페이지 상단으로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        setLoading(true);

        // 브랜드 정보 조회
        const { data: beandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('bid', bid)
          .single();

        if (brandError) {
          setError('브랜드를 찾을 수 없습니다.');
          return;
        }

        // 브랜드 상품 목록
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            brands(name, bid),
            categories(name, cid, slug),
            sub_categories(name, scid, slug)
          `)
          .eq('bid', bid)
          .order('is_soldout', { ascending: true })
          .order('created_at', { ascending: false });

        if (productsError) {
          setError('브랜드 상품을 불러오는 중 오류가 발생했습니다.');
          return;
        }

        setBrand(beandData);
        setProducts(productsData || []);


      } catch (error) {
        console.error('브랜드 데이터 로드 에러:', error);
        setError(error.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (bid) fetchBrand();

  }, [bid]);

  // 좋아요 기능
  const { liked, likeCount, toggleLike } = useLike({
    targetType: 'BRAND',
    targetId: bid,
    initialLikeCount: brand?.like_count || 0
  });
  const handleLikeToggle = toggleLike;

  if (loading) return <div>Loading</div>;
  if (error) return <div>error</div>;

  return (
    <div id='brand-wrap'>
      <div className='brand-bg'>
        <div className='brand-info-wrap'>
          {isAdmin &&
            <button type='button' className='btn-admin'>브랜드 관리</button>
          }
          <div className='brand-name-logo'>
            <a href={`/brand/${brand.bid}`}>
              <img src={getLogoSrc(brand.logo_url)} alt={brand.name} className='logo' />
            </a>
            <h2>
              {brand.name}
              {isAdmin &&
                <span className={`active-badge ${brand.is_active}`}>
                  {brand.is_active === true || brand.is_active === "true" ? "활성" : "비활성"}
                </span>}
            </h2>
          </div>
          {/* 브랜드 좋아요 버튼 */}
          <button className='btn-wish' onClick={handleLikeToggle} disabled={isAdmin}>
            <img src={liked ? `${import.meta.env.BASE_URL}images/icons/ico_likeFull.png` : `${import.meta.env.BASE_URL}images/icons/ico_like.png`} alt="좋아요" />
            <span>{likeCount}</span>
          </button>
        </div>
      </div>
      <div className='brand-products-wrap'>
        {/* 카테고리 필터 */}

        {/* 상품 목록 */}
        <ProductList
          products={products}
          emptyMessage="해당 브랜드의 상품이 없습니다."
        />
      </div>
    </div>
  );
};

export default Brand;