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
    finalTotal: 0
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

  // 주문 아이템 로드 (세션스토리지 우선, location.state 백업)
  const loadOrderItems = async () => {
    try {
      // 1. 먼저 세션스토리지에서 확인
      const sessionData = sessionStorage.getItem('checkoutItems');
      let orderItemsData = [];

      if (sessionData) {
        orderItemsData = JSON.parse(sessionData);
      } else if (location.state?.orderItems) {
        // 2. 세션스토리지에 없으면 location.state에서 확인
        orderItemsData = location.state.orderItems;
      }

      if (orderItemsData.length === 0) {
        alert('주문할 상품이 없습니다.');
        navigate('/cart');
        return;
      }

      // 이미 완전한 데이터가 있는 경우 (상품 상세페이지에서 온 경우)
      if (orderItemsData[0].product && orderItemsData[0].sku) {
        const fixedItems = orderItemsData.map(item => ({
          ...item,
          itemTotal: item.quantity * (item.product.price + (item.sku.additional_price || 0))
        }));
        setOrderItems(fixedItems);
        return;
      }

      // 기본 데이터만 있는 경우 (장바구니에서 온 경우) - 상품 상세 정보 로드
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

  // 가격 계산 (적립 포인트 제거)
  const calculatePricing = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.itemTotal || (item.itemPrice * item.quantity)), 0);

    // 포인트 사용 가능 최대 금액 (상품 금액의 30%)
    const maxPointsFromPrice = Math.floor(subtotal * 0.3);
    const maxPointsFromBalance = userInfo?.points_balance || 0;
    const maxUsable = Math.min(maxPointsFromPrice, maxPointsFromBalance);

    setMaxPointsUsable(maxUsable);

    // 실제 사용할 포인트
    const actualPointsToUse = Math.min(pointsToUse, maxUsable);

    const finalTotal = subtotal - actualPointsToUse;

    setPricing({
      subtotal,
      pointDiscount: actualPointsToUse,
      finalTotal
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
  let formattedValue = type === 'checkbox' ? checked : value;
  
  // 전화번호 필드인 경우 자동 포맷팅
  if (name === 'recipient_phone' && typeof value === 'string') {
    const phoneNumber = value.replace(/[^\d]/g, '');
    
    if (phoneNumber.length <= 3) {
      formattedValue = phoneNumber;
    } else if (phoneNumber.length <= 7) {
      formattedValue = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    } else {
      formattedValue = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
    }
  }

  setAddressForm(prev => ({
    ...prev,
    [name]: formattedValue
  }));
};

  // 주소 찾기
  const openPostcodeSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function (data) {
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

      if (error) {
        if (error.code === '23503') {
          alert('이 배송지는 주문 내역에서 사용 중이어서 삭제할 수 없습니다.');
          return;
        }
        throw error;
      }

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

  // 주문 처리 (재고 차감)
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
    setLoading(true);

    // ✅ 1. 예약재고만 해제 (실재고는 절대 건드리지 않음!)
    console.log('💳 주문 완료 처리 시작');
    
    for (const item of orderItems) {
      const { data: currentSku, error: skuError } = await supabase
        .from('product_skus')
        .select('stock_qty, reserved_qty')
        .eq('skid', item.skid)
        .single();

      if (skuError) throw new Error(`재고 확인 실패: ${skuError.message}`);

      console.log('예약 해제 전:', {
        skid: item.skid,
        현재재고: currentSku.stock_qty,
        예약재고: currentSku.reserved_qty,
        해제량: item.quantity
      });

      // ✅ 예약재고만 해제 (stock_qty는 절대 수정 안 함!)
      const { error: updateError } = await supabase
        .from('product_skus')
        .update({
          reserved_qty: Math.max(0, (currentSku.reserved_qty || 0) - item.quantity),
          updated_at: new Date().toISOString()
        })
        .eq('skid', item.skid);

      if (updateError) throw new Error(`예약 해제 실패: ${updateError.message}`);

      console.log(`✅ 예약 해제 완료: reserved_qty ${currentSku.reserved_qty} → ${Math.max(0, currentSku.reserved_qty - item.quantity)}`);

      // 재고 로그 기록
      await supabase
        .from('stock_log')
        .insert({
          skid: item.skid,
          pid: item.pid,
          change_qty: -item.quantity,
          reason: '주문 완료',
          memo: `주문 완료로 인한 예약 해제 (실재고 유지)`,
          created_by: user.id
        });
    }

    // 2. 주문 생성
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

    // 3. 주문 아이템들 저장
    const orderItemsData = orderItems.map(item => {
      const itemRatio = (item.itemTotal || (item.itemPrice * item.quantity)) / pricing.subtotal;
      const itemPointDiscount = Math.floor(pricing.pointDiscount * itemRatio);
      const originalPrice = item.itemPrice || (item.product?.price + (item.sku?.additional_price || 0));
      const actualSalePrice = Math.max(0, originalPrice - Math.floor(itemPointDiscount / item.quantity));

      return {
        oid: order.oid,
        pid: item.pid,
        skid: item.skid,
        quantity: item.quantity,
        unit_original_price: originalPrice,
        unit_sale_price: actualSalePrice,
        product_name: item.product?.name || '상품명 불명',
        product_brand: item.product?.brands?.name || '',
        sku_options: item.sku?.options || {},
        sku_code: item.sku?.sku_code || null
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) throw itemsError;

    // 4. 포인트 사용 처리
      if (usePoints && pointsToUse > 0) {

        await supabase
          .from('point_log')
          .insert([{
            uid: user.id,
            amount: -pointsToUse,
            reason: `주문 결제 사용 (주문번호: ${order.oid})`
          }]);
      }

    // 5. 장바구니에서 제거
    for (const item of orderItems) {
      await supabase
        .from('cart_items')
        .delete()
        .match({
          uid: user.id,
          pid: item.pid,
          skid: item.skid
        });
    }

    // ✅ 6. 세션 정리 (stockReserved 플래그 삭제)
    console.log('🗑️ 세션 정리 시작');
    sessionStorage.removeItem('checkoutItems');
    sessionStorage.removeItem('stockReserved');
    localStorage.removeItem('orderTimer');
    console.log('✅ 세션 정리 완료 - 주문 완료');

    alert('주문이 완료되었습니다!');
    navigate(`/order/orderdetail/${order.oid}`);

  } catch (error) {
    console.error('주문 처리 오류:', error);
    alert(error.message || '주문 처리 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
};

  return {
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