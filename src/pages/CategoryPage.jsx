import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import ProductCard from '../components/products/ProductCard';

const ALL_CATEGORY_SLUG = 'all';

const CategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const [categoryData, setCategoryData] = useState(null);
  const [subcategoryData, setSubcategoryData] = useState(null);
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError(null); // 에러 상태 초기화

        // 카테고리 정보 가져오기
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', categorySlug)
          .single();

        if (categoryError) {
          setError('카테고리를 찾을 수 없습니다.');
          return;
        }

        setCategoryData(category);

        let currentSubcategory = null;

        // 서브카테고리가 있는 경우
        if (subcategorySlug) {
          const { data: subcategory, error: subcategoryError } = await supabase
            .from('sub_categories')
            .select('*')
            .eq('cid', category.cid)
            .eq('slug', subcategorySlug)
            .single();

          if (subcategoryError) {
            setError('서브카테고리를 찾을 수 없습니다.');
            return;
          }

          currentSubcategory = subcategory;
          setSubcategoryData(subcategory);
        } else {
          setSubcategoryData(null);
        }

        // 카테고리의 상품 목록 가져오기
        let productsQuery = supabase.from('products').select('*');

        // "전체" 카테고리 처리
        const isAllCategory = category.slug === ALL_CATEGORY_SLUG;
        const isAllSubcategory = currentSubcategory?.slug === ALL_CATEGORY_SLUG;

        if (!isAllCategory) {
          // 메인 카테고리가 "전체"가 아닌 경우
          if (currentSubcategory && !isAllSubcategory) {
            // 서브카테고리가 있고 "전체"가 아닌 경우 - 특정 서브카테고리만
            productsQuery = productsQuery.eq('scid', currentSubcategory.scid);
          } else {
            // 서브카테고리가 없거나 "전체"인 경우 - 해당 메인 카테고리 전체
            productsQuery = productsQuery.eq('cid', category.cid);
          }
        }
        // 메인 카테고리가 "전체"인 경우 필터링 없이 모든 상품

        console.log('상품 조회:', {
          categorySlug: category.slug,
          subcategorySlug: currentSubcategory?.slug,
          isAllCategory,
          isAllSubcategory,
          category,
          currentSubcategory
        });

        const { data: products, error: productsError } = await productsQuery
          .order('created_at', { ascending: false });

        if (productsError) {
          console.error('상품 조회 에러:', productsError);
          setError('상품 목록을 불러올 수 없습니다.');
          return;
        }

        console.log('조회된 상품:', products);
        setProductList(products || []);

      } catch (error) {
        console.error('데이터 로드 에러:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [categorySlug, subcategorySlug]); // subcategoryData 제거, slug만 의존

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2>로딩 중...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2>{error}</h2>
        <p>요청하신 페이지를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ margin: '100px 0 0' }}>
      <h2 style={{ textAlign: 'center', fontWeight: 'bold' }}>
        {categoryData?.name} {subcategoryData && `> ${subcategoryData.name}`}
      </h2>

      <div>
        {productList.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: 50 }}>
            해당 카테고리에 상품이 없습니다.
          </p>
        ) : (
          <ul className='product-list'>
            {productList.map(product => (
              <ProductCard key={product.pid} product={product} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;