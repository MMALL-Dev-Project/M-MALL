import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';

export const useCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userInfo } = useAuth();
  
  // 주문 관련 상태
  const [orderItems, setOrderItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 포인트 관련 상태
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [maxPointsUsable, setMaxPointsUsable] = useState(0);
  
  // 결제 수단 상태
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [selectedCard, setSelectedCard] = useState('');
  
  // 가격 계산 상태
  const [pricing, setPricing] = useState({
    subtotal: 0,
    pointDiscount: 0,
    finalTotal: 0,
    earnedPoints: 0
  });

  // 주소 추가/수정 모달 상태
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    recipient_name: '',
    recipient_phone: '',
    postal_code: '',
    address: '',
    detail_address: '',
    is_default: false
  });

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadInitialData();
  }, [user]);

  // 가격 계산 (orderItems나 포인트 사용량 변경시)
  useEffect(() => {
    calculatePricing();
  }, [orderItems, pointsToUse]);

  // 우편번호 API 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // 초기 데이터 로드
  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadOrderItems(),
        loadUserAddresses()
      ]);
    } catch (error) {
      console.error('초기 데이터 로드 오류:', error);
      alert('주문 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 주문 아이템 로드
  const loadOrderItems = async () => {
    try {
      const orderItemsData = location.state?.orderItems || [];
      
      if (orderItemsData.length === 0) {
        alert('주문할 상품이 없습니다.');
        navigate('/cart');
        return;
      }

      // 상품 상세 정보 로드
      const itemsWithDetails = await Promise.all(
        orderItemsData.map(async (item) => {
          const { data: product } = await supabase
            .from('products')
            .select(`
              *,
              brands(name),
              product_skus(*)
            `)
            .eq('pid', item.pid)
            .single();

          const sku = product.product_skus.find(s => s.skid === item.skid);
          
          return {
            ...item,
            product,
            sku,
            itemPrice: product.price + (sku?.additional_price || 0),
            itemTotal: (product.price + (sku?.additional_price || 0)) * item.quantity
          };
        })
      );

      setOrderItems(itemsWithDetails);
    } catch (error) {
      console.error('주문 아이템 로드 오류:', error);
    }
  };

  // 사용자 주소 로드
  const loadUserAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('uid', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAddresses(data || []);
      
      // 기본 주소가 있으면 선택
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else if (data?.length > 0) {
        setSelectedAddress(data[0]);
      }
    } catch (error) {
      console.error('주소 로드 오류:', error);
    }
  };

  // 가격 계산
  const calculatePricing = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);
    
    // 포인트 사용 가능 최대 금액 (상품 금액의 50%)
    const maxPointsFromPrice = Math.floor(subtotal * 0.3);
    const maxPointsFromBalance = userInfo?.points_balance || 0;
    const maxUsable = Math.min(maxPointsFromPrice, maxPointsFromBalance);
    
    setMaxPointsUsable(maxUsable);
    
    // 실제 사용할 포인트
    const actualPointsToUse = Math.min(pointsToUse, maxUsable);
    
    // 적립될 포인트 계산
    const earnedPoints = orderItems.reduce((sum, item) => {
      const pointRate = item.product.point_rate || 1;
      return sum + Math.floor(item.itemTotal * pointRate / 100);
    }, 0);

    const finalTotal = subtotal - actualPointsToUse;

    setPricing({
      subtotal,
      pointDiscount: actualPointsToUse,
      finalTotal,
      earnedPoints
    });
  };

  // 포인트 사용 토글
  const handlePointsToggle = (checked) => {
    setUsePoints(checked);
    if (!checked) {
      setPointsToUse(0);
    }
  };

  // 포인트 입력 변경
  const handlePointsChange = (value) => {
    const numValue = parseInt(value) || 0;
    setPointsToUse(Math.min(numValue, maxPointsUsable));
  };

  // 전액 사용 버튼
  const handleUseAllPoints = () => {
    setPointsToUse(maxPointsUsable);
  };

  // 주소 폼 변경
  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 주소 찾기
  const openPostcodeSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function(data) {
          setAddressForm(prev => ({
            ...prev,
            postal_code: data.zonecode,
            address: data.roadAddress,
            detail_address: ''
          }));
        },
        width: '100%',
        height: '100%'
      }).open();
    } else {
      alert('주소 검색 기능을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // 주소 저장
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAddress) {
        // 수정
        const { error } = await supabase
          .from('user_addresses')
          .update({
            ...addressForm,
            updated_at: new Date().toISOString()
          })
          .eq('aid', editingAddress.aid);
          
        if (error) throw error;
      } else {
        // 새로 추가
        const { error } = await supabase
          .from('user_addresses')
          .insert([{
            ...addressForm,
            uid: user.id
          }]);
          
        if (error) throw error;
      }

      // 기본 주소로 설정된 경우 다른 주소들의 기본값 해제
      if (addressForm.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('uid', user.id)
          .neq('aid', editingAddress?.aid || 0);
      }

      alert('주소가 저장되었습니다.');
      setShowAddressModal(false);
      setEditingAddress(null);
      resetAddressForm();
      
      await loadUserAddresses();
    } catch (error) {
      console.error('주소 저장 오류:', error);
      alert('주소 저장에 실패했습니다.');
    }
  };

  // 주소 폼 리셋
  const resetAddressForm = () => {
    setAddressForm({
      name: '',
      recipient_name: '',
      recipient_phone: '',
      postal_code: '',
      address: '',
      detail_address: '',
      is_default: false
    });
  };

  // 주소 수정 시작
  const startEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name,
      recipient_name: address.recipient_name,
      recipient_phone: address.recipient_phone,
      postal_code: address.postal_code,
      address: address.address,
      detail_address: address.detail_address || '',
      is_default: address.is_default
    });
    setShowAddressModal(true);
  };

  // 주소 삭제
  const handleDeleteAddress = async (addressId) => {
    if (!confirm('이 주소를 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('aid', addressId);
        
      if (error) throw error;
      
      alert('주소가 삭제되었습니다.');
      await loadUserAddresses();
    } catch (error) {
      console.error('주소 삭제 오류:', error);
      alert('주소 삭제에 실패했습니다.');
    }
  };

  // 주소 모달 닫기
  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
    resetAddressForm();
  };

  // 주문 처리
  const handleOrder = async () => {
    if (!selectedAddress) {
      alert('배송지를 선택해주세요.');
      return;
    }

    if (!selectedPayment) {
      alert('결제 수단을 선택해주세요.');
      return;
    }

    if (selectedPayment === 'card' && !selectedCard) {
      alert('카드를 선택해주세요.');
      return;
    }

    try {
      // 주문 생성
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          uid: user.id,
          pid: orderItems[0].pid,
          total_amount: pricing.finalTotal,
          status: 'PENDING',
          address_id: selectedAddress.aid
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 주문 아이템들 저장
      const orderItemsData = orderItems.map(item => {
      // 이 상품이 전체에서 차지하는 비율 계산
      const itemRatio = item.itemTotal / pricing.subtotal;
      // 포인트 할인을 비율에 따라 배분
      const itemPointDiscount = Math.floor(pricing.pointDiscount * itemRatio);
      // 실제 판매가 계산
      const actualSalePrice = Math.max(0, item.itemPrice - Math.floor(itemPointDiscount / item.quantity));

      return {
        oid: order.oid,
        pid: item.pid,
        skid: item.skid,
        quantity: item.quantity,
        unit_original_price: item.itemPrice, // 원가
        unit_sale_price: actualSalePrice,    // 포인트 할인 적용된 판매가
        product_name: item.product.name,
        product_brand: item.product.brands?.name || '',
        sku_options: item.sku?.options || {},
        sku_code: item.sku?.sku_code || null
      };
    });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

    // 재고 업데이트
await Promise.all(
  orderItems.map(async (item) => {
    // 현재 재고 조회
    const { data: currentSku } = await supabase
      .from('product_skus')
      .select('stock_qty')
      .eq('skid', item.skid)
      .single();

    // 재고 차감
    await supabase
      .from('product_skus')
      .update({
        stock_qty: currentSku.stock_qty - item.quantity
      })
      .eq('skid', item.skid);

    // 재고 로그 기록
    await supabase
      .from('stock_log')
      .insert({
        skid: item.skid,
        pid: item.pid,
        change_qty: -item.quantity,
        reason: `주문 판매 (주문번호: ${order.oid})`,
        created_by: user.id
      });
  })
);

      // 포인트 사용 처리
      if (usePoints && pointsToUse > 0) {
        const { error: pointsError } = await supabase
          .from('user_info')
          .update({
            points_balance: (userInfo.points_balance || 0) - pointsToUse
          })
          .eq('id', user.id);

        if (pointsError) throw pointsError;

        await supabase
          .from('point_log')
          .insert([{
            uid: user.id,
            amount: -pointsToUse,
            reason: `주문 결제 사용 (주문번호: ${order.oid})`
          }]);
      }

      // 포인트 적립 처리
      if (pricing.earnedPoints > 0) {
        const { data: currentUser } = await supabase
            .from('user_info')
            .select('points_balance')
            .eq('id', user.id)
            .single();
            
        const { error: earnError } = await supabase
            .from('user_info')
            .update({
            points_balance: (currentUser.points_balance || 0) + pricing.earnedPoints
            })
            .eq('id', user.id);

        if (earnError) throw earnError;

        await supabase
          .from('point_log')
          .insert([{
            uid: user.id,
            amount: pricing.earnedPoints,
            reason: `주문 구매 적립 (주문번호: ${order.oid})`
          }]);
      }

      alert('주문이 완료되었습니다!');
      navigate(`/order/orderdetail/${order.oid}`);
      
    } catch (error) {
      console.error('주문 처리 오류:', error);
      alert('주문 처리 중 오류가 발생했습니다.');
    }
  };

  return {
    // 상태
    orderItems,
    addresses,
    selectedAddress,
    loading,
    usePoints,
    pointsToUse,
    maxPointsUsable,
    selectedPayment,
    selectedCard,
    pricing,
    showAddressModal,
    editingAddress,
    addressForm,
    userInfo,

    // 상태 변경 함수
    setSelectedAddress,
    setSelectedPayment,
    setSelectedCard,
    setShowAddressModal,

    // 이벤트 핸들러
    handlePointsToggle,
    handlePointsChange,
    handleUseAllPoints,
    handleAddressFormChange,
    openPostcodeSearch,
    handleSaveAddress,
    startEditAddress,
    handleDeleteAddress,
    closeAddressModal,
    handleOrder
  };
};