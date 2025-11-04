import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@config/supabase';
import { useAuth } from "@contexts/AuthContext";
import { getThumbnailSrc } from "@utils/image";
import SelectedOptionCard from './SelectedOptionCard';
import { useLike } from "@hooks/useLike";

const ProductInfo = ({ product }) => {
  // 사용자 정보
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(0);
  const navigate = useNavigate();

  // SKU 관련 상태 - 상품별 재고 관리를 위한 SKU(Stock Keeping Unit) 데이터
  const [productSkus, setProductSkus] = useState([]); // 해당 상품의 모든 SKU 목록
  const [selectedOptions, setSelectedOptions] = useState({}); // 현재 선택 중인 옵션 상태
  const [selectedSku, setSelectedSku] = useState(null); // 옵션 조합으로 매칭된 SKU
  const [selectedOptionCards, setSelectedOptionCards] = useState([]); // 장바구니에 담을 선택된 옵션카드들
  const [quantity, setQuantity] = useState(1);

  // 품절 상태(대기 상품 제외)
  const [soldOut, setSoldOut] = useState(false);

  // 좋아요 기능을 위한 hook 사용
  const { liked, likeCount, toggleLike } = useLike({
    targetType: 'PRODUCT',
    targetId: product?.pid,
    initialLikeCount: product?.like_count || 0
  });

  const [loading, setLoading] = useState(false);

  // 상품 로딩 상태 처리
  if (!product) {
    return <div>Loading...</div>;
  }

  // 사용자 보유포인트 불러오기
  useEffect(() => {
    if (!user) return;

    const fetchUserPoints = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_info')
          .select('points_balance')
          .eq('id', user.id)
          .single();

        setUserPoints(data?.points_balance || 0);
      } catch (error) {
        console.error('사용자 포인트 조회 에러:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserPoints();
  }, []);


  // SKU 데이터 불러오기 - 상품의 재고 및 옵션별 정보
  useEffect(() => {
    const fetchProductSkus = async () => {
      try {
        setLoading(true);

        // 현재 상품의 활성화된 SKU만 조회
        const { data: skusData, error } = await supabase
          .from('product_skus')
          .select('*')
          .eq('pid', product.pid)
          .eq('is_active', true);

        setProductSkus(skusData || []);

      } catch (error) {
        console.error('SKU 데이터 로드 에러:', error);
        setProductSkus([]);
      } finally {
        setLoading(false);
      }
    };

    if (product.pid) {
      fetchProductSkus();
    }
  }, [product.pid]);

  // 재고 품절 상태 확인 함수
  const checkSoldOut = () => {
    if (productSkus.length > 0) {
      // 모든 SKU의 재고량 합산
      const totalStock = productSkus.reduce((sum, sku) => sum + (sku.stock_qty || 0), 0);

      // 총 재고가 0이면 전체 상품 품절 처리
      setSoldOut(totalStock === 0);


      return totalStock;
    }
    return 0;
  };

  // 재고 품절 상태 확인 함수 호출
  useEffect(() => {
    checkSoldOut();
  }, [productSkus, product.pid]);


  // 초기 기본 옵션카드 생성 함수 (단일 옵션)
  const initDefaultCard = () => {
    // 단일 옵션이 아닐 경우 초기화
    setSelectedOptionCards([]);

    // 옵션이 없는 상품의 경우 기본 SKU를 자동으로 선택된 상태로 표시
    if (productSkus.length > 0 && (!product.option_types || Object.keys(product.option_types).length === 0)) {
      const defaultSku = productSkus[0];

      // 재고가 있는 경우에만 기본 옵션카드 추가
      if (defaultSku && defaultSku.stock_qty > 0) {
        setSelectedOptionCards([{
          sku: defaultSku,
          quantity: 1
        }]);
      }
    }
  }

  useEffect(() => {
    initDefaultCard();
  }, [productSkus, product.option_types]);

  // 선택된 옵션에 맞는 SKU 찾기 - 사용자가 선택한 옵션 조합으로 해당하는 SKU 매칭
  useEffect(() => {
    // SKU 데이터나 선택된 옵션이 없으면 초기화
    if (!productSkus.length || !Object.keys(selectedOptions).length) {
      setSelectedSku(null);
      return;
    }

    // product.option_types에 정의된 모든 필수 옵션이 선택되었는지 확인
    const requiredOptions = Object.keys(product.option_types || {});

    const allOptionsSelected = requiredOptions.every(optionType =>
      selectedOptions[optionType] && selectedOptions[optionType] !== ''
    );

    if (!allOptionsSelected) {
      setSelectedSku(null);
      return;
    }

    // 선택된 옵션 조합과 일치하는 SKU 찾기
    const matchingSku = productSkus.find(sku => {
      let skuOptions;

      // JSONB 데이터 파싱 처리
      if (typeof sku.options === 'string') {
        try {
          skuOptions = JSON.parse(sku.options);
        } catch (e) {
          console.error('SKU 옵션 파싱 에러:', e);
          return false;
        }
      } else {
        skuOptions = sku.options || {};
      }

      // 모든 필수 옵션이 정확히 일치하는지 확인
      return requiredOptions.every(optionType => {
        return skuOptions[optionType] === selectedOptions[optionType];
      });
    });

    setSelectedSku(matchingSku || null);
  }, [selectedOptions, productSkus, product.option_types]);

  // 자동 옵션카드 추가 - SKU가 선택되면 자동으로 옵션카드에 추가
  useEffect(() => {
    if (selectedSku && selectedSku.stock_qty > 0) {
      // 이미 같은 SKU가 선택되어 있는지 확인
      const existingCardIndex = selectedOptionCards.findIndex(card => card.sku.skid === selectedSku.skid);

      if (existingCardIndex >= 0) {
        // 기존 카드의 수량 업데이트
        const updatedCards = [...selectedOptionCards];
        updatedCards[existingCardIndex].quantity += quantity;
        setSelectedOptionCards(updatedCards);
      } else {
        // 새로운 옵션카드 추가
        const newCard = {
          sku: selectedSku,
          quantity: quantity
        };
        setSelectedOptionCards(prev => [...prev, newCard]);
      }

      // 선택 상태 초기화
      setSelectedOptions({});
      setSelectedSku(null);
      setQuantity(1);
    }
  }, [selectedSku, quantity, selectedOptionCards]);


  // 할인 가격 계산 함수 - M포인트를 사용한 할인 계산
  const calculateDiscountPrice = (product, userPoints) => {
    if (!product || !product.point_rate) return 0;
    // 최대 사용 가능한 포인트 = 상품가격 * 포인트 적용률 / 100
    const maxPointUsage = Math.floor((product.price * product.point_rate) / 100);
    // 실제 할인된 가격 = 상품가격 - 사용가능한 포인트 (보유포인트와 최대사용포인트 중 작은 값)
    const discountedPrice = product.price - Math.min(userPoints, maxPointUsage);
    return discountedPrice;
  }

  // 최신 SKU 데이터 다시 불러오기
  const refreshProductSkus = async () => {
    try {
      const { data: skusData, error } = await supabase
        .from('product_skus')
        .select('*')
        .eq('pid', product.pid)
        .eq('is_active', true);

      if (!error) {
        setProductSkus(skusData || []);
        return skusData || [];
      }
      return [];
    } catch (error) {
      console.error('SKU 데이터 새로고침 에러:', error);
      return [];
    }
  };

  // 장바구니 핸들러 함수
  const handleAddToCart = async () => {
    // 로그인 확인
    if (!user) {
      navigate('/login');
      return;
    }
    // 선택된 옵션카드가 없으면 경고
    if (selectedOptionCards.length === 0) {
      alert('구매할 상품을 선택해주세요.');
      return;
    }

    // 최신 재고 데이터 조회
    const latestSkus = await refreshProductSkus();

    // 최신 데이터로 품절 상태 확인
    const totalStock = latestSkus.reduce((sum, sku) => sum + (sku.stock_qty || 0), 0);

    if (totalStock === 0) {
      alert('상품이 품절되었습니다.');
      setSoldOut(true);
      return;
    }

    // 선택된 카드별 재고 확인
    for (const card of selectedOptionCards) {
      const latestSku = latestSkus.find(sku => sku.skid === card.sku.skid);
      if (!latestSku || latestSku.stock_qty < card.quantity) {
        alert(`선택한 상품의 재고가 부족합니다. (현재 재고: ${latestSku?.stock_qty || 0}개)`);
        return;
      }
    }

    // 콘솔에 선택된 카드 정보 출력

    try {
      // 각 선택된 옵션카드를 cart_items 에 insert 또는 update
      for (const card of selectedOptionCards) {
        // 기존에 같은 skid와 uid가 있는지 확인
        const { data: existingItems, error: selectError } = await supabase
          .from('cart_items')
          .select('caid, quantity')
          .eq('skid', card.sku.skid)
          .eq('uid', user.id);

        if (selectError) {
          throw selectError;
        }

        if (existingItems && existingItems.length > 0) {
          // 기존 아이템이 있으면 수량만 업데이트
          const existingItem = existingItems[0];
          const newQuantity = existingItem.quantity + card.quantity;

          const { error: updateError } = await supabase
            .from('cart_items')
            .update({
              quantity: newQuantity
            })
            .eq('caid', existingItem.caid);

          if (updateError) throw updateError;

        } else {
          // 새로운 아이템 추가
          const { error: insertError } = await supabase
            .from('cart_items')
            .insert({
              skid: card.sku.skid,
              quantity: card.quantity,
              pid: product.pid,
              uid: user.id
            });

          if (insertError) throw insertError;

          console.log(`새 아이템 추가: skid=${card.sku.skid}, quantity=${card.quantity}`);
        }
      }

      alert('장바구니에 추가되었습니다!');

      initDefaultCard();

    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      alert('장바구니 추가에 실패했습니다.');
    }
  };

  // 주문하기 핸들러 함수
  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // 선택된 옵션카드가 없으면 경고
    if (selectedOptionCards.length === 0) {
      alert('구매할 상품을 선택해주세요.');
      return;
    }

    // 모든 선택된 옵션카드의 재고 확인
    for (const card of selectedOptionCards) {
      if (card.sku.stock_qty < card.quantity) {
        alert(`선택한 수량이 재고보다 많습니다. (재고: ${card.sku.stock_qty}개)`);
        return;
      }
    }
    // 10분 후 만료시간
    localStorage.setItem('orderTimer', Date.now() + (10 * 60 * 1000));

    // 재고 예약 추가
    try {
      for (const card of selectedOptionCards) {
        // 현재 reserved_qty 값을 먼저 가져오기
        const { data: currentSku } = await supabase
          .from('product_skus')
          .select('stock_qty, reserved_qty')
          .eq('skid', card.sku.skid)
          .single();

        // 그 값에 수량을 더해서 업데이트
        const { error } = await supabase
          .from('product_skus')
          .update({
            stock_qty: currentSku.stock_qty - card.quantity, 
            reserved_qty: (currentSku.reserved_qty || 0) + card.quantity
          })
          .eq('skid', card.sku.skid);

        if (error) throw error;
      }
    } catch (error) {
      console.error('재고 예약 실패:', error);
      return;
    }

    // 선택된 모든 옵션카드를 주문 아이템으로 변환
    const orderItems = selectedOptionCards.map(card => ({
      pid: product.pid,
      skid: card.sku.skid,
      quantity: card.quantity,
      // 주문서에서 필요한 추가 정보들
      product: {
        pid: product.pid,
        name: product.name,
        price: product.price,
        thumbnail_url: product.thumbnail_url,
        brands: product.brands
      },
      sku: {
        skid: card.sku.skid,
        options: card.sku.options,
        additional_price: card.sku.additional_price || 0,
        sku_code: card.sku.sku_code
      },
      itemTotal: product.price + (card.sku.additional_price || 0)
    }));

    // 세션스토리지에 저장
    sessionStorage.setItem('checkoutItems', JSON.stringify(orderItems));

    // 주문서 페이지로 이동
    navigate('/order/checkout');
  };

  // 옵션 선택 핸들러 - 사용자가 드롭다운에서 옵션을 선택할 때 호출
  const handleOptionChange = (optionType, value) => {
    setSelectedOptions(prev => {
      const newOptions = { ...prev };

      // 현재 옵션 업데이트
      newOptions[optionType] = value;

      // 연속적인 옵션 선택을 위해 이후 옵션들 초기화
      // 예: size를 변경하면 color 선택을 초기화
      const optionKeys = Object.keys(product.option_types || {});
      const currentIndex = optionKeys.indexOf(optionType);

      // 현재 선택한 옵션 이후의 모든 옵션을 초기화
      for (let i = currentIndex + 1; i < optionKeys.length; i++) {
        newOptions[optionKeys[i]] = '';
      }

      return newOptions;
    });
  };

  // 옵션카드에 추가하기 - 수동 추가 버튼 (이제는 거의 사용되지 않음)
  const handleAddToSelectedOptions = () => {
    if (!selectedSku || selectedSku.stock_qty === 0) {
      alert('선택하신 옵션은 품절되었습니다.');
      return;
    }

    // 이미 같은 SKU가 선택되어 있는지 확인
    const existingCardIndex = selectedOptionCards.findIndex(card => card.sku.skid === selectedSku.skid);

    if (existingCardIndex >= 0) {
      // 기존 카드의 수량 업데이트
      const updatedCards = [...selectedOptionCards];
      updatedCards[existingCardIndex].quantity += quantity;
      setSelectedOptionCards(updatedCards);
    } else {
      // 새로운 옵션카드 추가
      const newCard = {
        sku: selectedSku,
        quantity: quantity
      };
      setSelectedOptionCards(prev => [...prev, newCard]);
    }

    // 선택 상태 초기화
    setSelectedOptions({});
    setSelectedSku(null);
    setQuantity(1);
  };

  // 선택된 옵션카드 제거
  const handleRemoveOptionCard = (skid) => {
    setSelectedOptionCards(prev => prev.filter(card => card.sku.skid !== skid));
  };

  // 옵션카드 수량 변경
  const handleCardQuantityChange = (skid, newQuantity) => {
    setSelectedOptionCards(prev =>
      prev.map(card =>
        card.sku.skid === skid
          ? { ...card, quantity: newQuantity }
          : card
      )
    );
  };

  // 특정 옵션값이 품절인지 확인 - 선택 가능한 옵션인지 체크
  const isOptionAvailable = (optionType, optionValue) => {
    // 현재까지 선택된 옵션들과 함께 해당 옵션값을 선택했을 때 사용 가능한 SKU가 있는지 확인
    const testOptions = { ...selectedOptions, [optionType]: optionValue };

    return productSkus.some(sku => {
      if (sku.stock_qty === 0) return false; // 재고가 0이면 사용 불가

      let skuOptions;
      if (typeof sku.options === 'string') {
        try {
          skuOptions = JSON.parse(sku.options);
        } catch (e) {
          return false;
        }
      } else {
        skuOptions = sku.options || {};
      }

      // 현재까지 선택된 옵션들과 모두 일치하는 SKU가 있는지 확인
      return Object.entries(testOptions).every(([type, value]) => {
        return !value || skuOptions[type] === value;
      });
    });
  };

  // select 내에서 특정 옵션값의 재고 확인 함수
  const getOptionStock = (optionType, optionValue) => {
    const testOptions = { ...selectedOptions, [optionType]: optionValue };

    const matchingSkus = productSkus.filter(sku => {
      let skuOptions;
      if (typeof sku.options === 'string') {
        try {
          skuOptions = JSON.parse(sku.options);
        } catch (e) {
          return false;
        }
      } else {
        skuOptions = sku.options || {};
      }

      return Object.entries(testOptions).every(([type, value]) => {
        return !value || skuOptions[type] === value;
      });
    });

    if (matchingSkus.length === 0) return 0;
    return Math.min(...matchingSkus.map(sku => sku.stock_qty || 0));
  };

  // 다음 옵션 선택박스가 활성화되어야 하는지 확인 (순차적 활성화)
  const isNextOptionEnabled = (currentOptionType) => {
    const optionKeys = Object.keys(product.option_types || {});
    const currentIndex = optionKeys.indexOf(currentOptionType);

    // 첫 번째 옵션이거나 이전 옵션들이 모두 선택된 경우에만 활성화
    if (currentIndex === 0) return true;

    for (let i = 0; i < currentIndex; i++) {
      if (!selectedOptions[optionKeys[i]]) {
        return false;
      }
    }
    return true;
  };

  // 좋아요 토글 핸들러
  const handleLikeToggle = toggleLike;
  return (
    <>
      {/* 상품 정보 영역 */}
      <div className={`product-info ${soldOut ? 'soldout' : ''}`}>
        {/* 상품 이미지 */}
        <div className='photo'>
          <img src={getThumbnailSrc(product.thumbnail_url)} alt={product.name} />
        </div>
        {/* 상품 정보 */}
        <div className='info-wrap'>
          {/* 카테고리 & 브랜드 */}
          <div className='info-main'>
            <Link
              to={
                product.bid
                  ? `/brand/${product.brands?.bid}`
                  : `/${product.categories?.slug}/${product.sub_categories?.slug}`
              } className='category-brand'
            >
              {product.brands?.name || product.sub_categories.name || '미분류'}
            </Link>
            <div className='name'>
              {product.name}
              {soldOut && (
                <span className='soldout-tag' style={{ marginLeft: '10px' }}>
                  <span>품절</span>
                </span>
              )}
            </div>
            <div className='price'>
              <span>{product.price.toLocaleString('ko-KR')}</span>원
            </div>
            <div className='price-note'>
              {
                user
                  ? `보유 M포인트 모두 사용 시 ${calculateDiscountPrice(product, userPoints).toLocaleString('ko-KR')} 원`
                  : `최대 M포인트 할인 시 ${Math.floor(product.price * (100 - product.point_rate) / 100).toLocaleString('ko-KR')}원`
              }
            </div>
            <div className='mpoint'>최대 {product.point_rate}% M포인트</div>
          </div>
          <div className='info-extra'>
            <dl className='modelName'>
              <dt>모델명</dt>
              <dd>{product?.name.replace(/[\[\(].*?[\]\)]/g, '').trim()}</dd>
            </dl>
            <dl>
              <dt>발송기일</dt>
              <dd>7일 이내/ 평균 1일</dd>
            </dl>
          </div>

          {/* 옵션 선택 영역 - 여러 옵션이 있는 상품의 경우 */}
          {product.option_types && Object.keys(product.option_types).length > 0 && (
            <div className='info-option-area'>
              <h4>옵션 선택</h4>
              {/* product.option_types 객체를 배열로 변환해서 map 반복 */}
              {Object.entries(product.option_types).map(([optionType, options]) => (
                <div key={optionType} className='option-box'>
                  <label htmlFor={optionType} />
                  <select
                    id={optionType}
                    value={selectedOptions[optionType] || ''}
                    onChange={(e) => handleOptionChange(optionType, e.target.value)}
                    disabled={!isNextOptionEnabled(optionType) || soldOut}
                    className="select-common"
                  >
                    <option value="">
                      {optionType.toUpperCase()}
                    </option>
                    {options.map((option, index) => {
                      const stock = getOptionStock(optionType, option);
                      const isAvailable = isOptionAvailable(optionType, option);
                      return (
                        <option
                          key={option}
                          value={option}
                          disabled={!isAvailable}
                        >
                          {option}
                          {!isAvailable
                            ? ' (품절)'
                            : stock > 0 && stock <= 5
                              ? ' (재고임박)'
                              : ''
                          }
                        </option>
                      );
                    }
                    )}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* 선택된 옵션카드들 표시 */}
          {selectedOptionCards.map(card => (
            <SelectedOptionCard
              key={card.sku.skid}
              sku={card.sku}
              quantity={card.quantity}
              onQuantityChange={(newQuantity) => handleCardQuantityChange(card.sku.skid, newQuantity)}
              onRemove={() => handleRemoveOptionCard(card.sku.skid)}
            />
          ))}

          <div className='btn-group'>
            <button className='btn-wish' onClick={handleLikeToggle}>
              <img src={liked ? `${import.meta.env.BASE_URL}images/icons/ico_likeFull.png` : `${import.meta.env.BASE_URL}images/icons/ico_like.png`} alt="좋아요" />
              <span>{likeCount}</span>
            </button>
            <div className='purchase-buttons'>
              <button
                onClick={handleAddToCart}
                className='btn-cart'
                disabled={selectedOptionCards.length === 0}
              >
                장바구니
              </button>
              <button
                onClick={handlePurchase}
                className='btn-buy'
                disabled={selectedOptionCards.length === 0}
              >구매하기</button>
            </div>
          </div>
        </div>
      </div>
      {/* 상품 디테일 이미지 영역 */}
      <div className='product-detail-images'>
        {product.images && product.images.length > 0 ? (
          product.images.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`${product.name} 상세 이미지 ${index + 1}`}
            />
          ))
        ) : (<p>상세 이미지가 없습니다.</p>
        )}
      </div>
    </>
  );
};

export default ProductInfo;