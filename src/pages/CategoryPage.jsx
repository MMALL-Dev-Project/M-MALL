import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';

const CategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const [categoryData, setCategoryData] = useState(null);
  const [subcategoryData, setSubcategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);

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

          setSubcategoryData(subcategory);
        } else {
          setSubcategoryData(null);
        }

      } catch (error) {
        console.error('데이터 로드 에러:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [categorySlug, subcategorySlug]);

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
    <div />
  );
};

export default CategoryPage;