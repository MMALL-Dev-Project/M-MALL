import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import ProductCard from '../components/products/ProductCard';

const ALL_CATEGORY_SLUG = 'all';

const CategoryPage = React.memo(() => {
  const { categorySlug, subcategorySlug } = useParams();
  const [data, setData] = useState({
    category: null,
    subcategory: null,
    products: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 카테고리 조회
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', categorySlug)
          .single();

        if (categoryError) {
          throw new Error('카테고리를 찾을 수 없습니다.');
        }

        // 서브카테고리 조회
        let subcategory = null;
        if (subcategorySlug) {
          const { data: subcategoryData, error: subcategoryError } = await supabase
            .from('sub_categories')
            .select('*')
            .eq('cid', category.cid)
            .eq('slug', subcategorySlug)
            .single();

          if (subcategoryError) {
            throw new Error('서브카테고리를 찾을 수 없습니다.');
          }
          subcategory = subcategoryData;
        }

        // 상품 쿼리 구성 및 실행
        let productsQuery = supabase
          .from('products')
          .select(`
            *, 
            brands(name, bid),
            categories(name, cid, slug),
            sub_categories(name, scid, slug)
          `);

        const isAllCategory = category.slug === ALL_CATEGORY_SLUG;
        const isAllSubcategory = subcategory?.slug === ALL_CATEGORY_SLUG;

        if (!isAllCategory) {
          if (subcategory && !isAllSubcategory) {
            productsQuery = productsQuery.eq('scid', subcategory.scid);
          } else {
            productsQuery = productsQuery.eq('cid', category.cid);
          }
        }

        const { data: products, error: productsError } = await productsQuery
          .order('is_soldout', { ascending: true })
          .order('created_at', { ascending: false });
        if (productsError) {
          console.error('상품 조회 에러:', productsError);
          throw new Error('상품 목록을 불러올 수 없습니다.');
        }

        // 상태 업데이트
        setData({
          category,
          subcategory,
          products: products || []
        });

      } catch (error) {
        console.error('데이터 로드 에러:', error);
        setError(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categorySlug, subcategorySlug]);

  // 상품 목록만 메모화
  const ProductList = useMemo(() => {
    if (data.products.length === 0) {
      return (
        <p style={{ textAlign: 'center', marginTop: 50 }}>
          해당 카테고리에 상품이 없습니다.
        </p>
      );
    }

    return (
      <ul className='product-list'>
        {data.products.map(product => (
          <ProductCard key={product.pid} product={product} />
        ))}
      </ul>
    );
  }, [data.products]);

  if (loading) {
    return (
      <div style={{ padding: '300px 20px', textAlign: 'center' }}>
        <h2>로딩 중...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '300px 20px', textAlign: 'center' }}>
        <h2>{error}</h2>
        <p>요청하신 페이지를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '100px' }}>
      <h2 style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '40px' }}>
        {data.category?.name} {data.subcategory && `> ${data.subcategory.name}`}
      </h2>
      <div>{ProductList}</div>
    </div>
  );
});

CategoryPage.displayName = 'CategoryPage';

export default CategoryPage;