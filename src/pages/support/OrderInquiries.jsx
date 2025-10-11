import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import UserInquiries from './UserInquiries';
import AdminInquiries from './AdminInquiries';
import './OrderInquiries.css';

const OrderInquiries = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userInfo } = useAuth();
  
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const itemsPerPage = 10;

  const isAdmin = userInfo?.role === 'admin';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!userInfo) return;
    
    loadInquiries();
  }, [user, userInfo, statusFilter, typeFilter, currentPage]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      
      let countQuery = supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true });

      if (!isAdmin) {
        countQuery = countQuery.eq('uid', user.id);
      }
      if (statusFilter !== 'ALL') {
        countQuery = countQuery.eq('status', statusFilter);
      }
      if (typeFilter !== 'ALL') {
        countQuery = countQuery.eq('type', typeFilter);
      }

      const { count } = await countQuery;
      setTotalInquiries(count || 0);
      
      const startIndex = (currentPage - 1) * itemsPerPage;
      
      let query = supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1);

      if (!isAdmin) {
        query = query.eq('uid', user.id);
      }
      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== 'ALL') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      if (isAdmin) {
        const inquiriesWithDetails = await Promise.all(
          data.map(async (inquiry) => {
            const { data: userInfo, error: userError } = await supabase
              .from('user_info')
              .select('name, email, user_id')
              .eq('id', inquiry.uid)
              .single();

            if (userError) console.error('사용자 정보 조회 오류:', userError);

            let orderInfo = null;
            if (inquiry.oid) {
              const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('oid, total_amount, created_at')
                .eq('oid', inquiry.oid)
                .maybeSingle();

              if (orderError) {
                console.error('주문 정보 조회 오류:', orderError);
              } else {
                orderInfo = orderData;
              }
            }

            let productInfo = null;
            if (inquiry.pid) {
              const { data: productData, error: productError } = await supabase
                .from('products')
                .select('name, thumbnail_url, brands(name)')
                .eq('pid', inquiry.pid)
                .maybeSingle();

              if (productError) {
                console.error('상품 정보 조회 오류:', productError);
              } else if (productData) {
                productInfo = {
                  name: productData.name,
                  thumbnail: productData.thumbnail_url,
                  brand: productData.brands?.name
                };
              }
            }

            return {
              ...inquiry,
              user_info: userInfo,
              orders: orderInfo,
              product_info: productInfo
            };
          })
        );
        setInquiries(inquiriesWithDetails || []);
      } else {
        const inquiriesWithOrders = await Promise.all(
          data.map(async (inquiry) => {
            let orderInfo = null;
            if (inquiry.oid) {
              const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('oid, total_amount, created_at')
                .eq('oid', inquiry.oid)
                .maybeSingle();

              if (orderError) {
                console.error('주문 정보 조회 오류:', orderError);
              } else {
                orderInfo = orderData;
              }
            }

            let productInfo = null;
            if (inquiry.pid) {
              const { data: productData, error: productError } = await supabase
                .from('products')
                .select('name, thumbnail_url, brands(name)')
                .eq('pid', inquiry.pid)
                .maybeSingle();

              if (productError) {
                console.error('상품 정보 조회 오류:', productError);
              } else if (productData) {
                productInfo = {
                  name: productData.name,
                  thumbnail: productData.thumbnail_url,
                  brand: productData.brands?.name
                };
              }
            }

            return {
              ...inquiry,
              orders: orderInfo,
              product_info: productInfo
            };
          })
        );
        setInquiries(inquiriesWithOrders || []);
      }
    } catch (error) {
      console.error('문의 목록 로드 오류:', error);
      alert('문의 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (type, value) => {
    if (type === 'status') {
      setStatusFilter(value);
    } else {
      setTypeFilter(value);
    }
    setCurrentPage(1);
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  // 관리자 / 일반 유저 분기
  if (isAdmin) {
    return (
      <AdminInquiries
        inquiries={inquiries}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        currentPage={currentPage}
        totalInquiries={totalInquiries}
        itemsPerPage={itemsPerPage}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onReload={loadInquiries}
        userInfo={userInfo}
      />
    );
  }

  return (
    <UserInquiries
      inquiries={inquiries}
      currentPage={currentPage}
      totalInquiries={totalInquiries}
      itemsPerPage={itemsPerPage}
      onPageChange={handlePageChange}
      onReload={loadInquiries}
      user={user}
      location={location}
    />
  );
};

export default OrderInquiries;