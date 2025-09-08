import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../config/supabase';

const ProductInfo = ({ product }) => {
    const [selectedOptions, setSelectedOptions] = useState({});
    const [selectedSku, setSelectedSku] = useState(null);
    const [productSkus, setProductSkus] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    if (!product) {
        return <div>Loading...</div>;
    }

    // SKU 데이터 가져오기
    useEffect(() => {
        const fetchProductSkus = async () => {
            console.log('=== SKU 데이터 가져오기 시작 ===');
            console.log('Product PID:', product.pid);

            try {
                // 현재 상품의 모든 SKU 확인
                const { data: allSkusData, error: allSkusError } = await supabase
                    .from('product_skus')
                    .select('*')
                    .eq('pid', product.pid);

                console.log(`PID ${product.pid}의 모든 SKU 데이터:`, allSkusData);
                console.log('모든 SKU 에러:', allSkusError);

                // 활성화된 SKU만 가져오기
                const { data: skusData, error } = await supabase
                    .from('product_skus')
                    .select('*')
                    .eq('pid', product.pid)
                    .eq('is_active', true);

                console.log(`PID ${product.pid}의 활성화된 SKU 데이터:`, skusData);
                console.log('SKU 데이터 에러:', error);

                // 임시로 is_active 조건 없이 설정
                const finalSkuData = allSkusData && allSkusData.length > 0 ? allSkusData : skusData;
                console.log('최종 사용할 SKU 데이터:', finalSkuData);

                setProductSkus(finalSkuData || []);

                // SKU 옵션 구조 확인
                if (finalSkuData && finalSkuData.length > 0) {
                    console.log('첫 번째 SKU 상세 정보:', finalSkuData[0]);
                    console.log('첫 번째 SKU 옵션 상세:', {
                        raw: finalSkuData[0].options,
                        type: typeof finalSkuData[0].options,
                        isString: typeof finalSkuData[0].options === 'string',
                        parsed: typeof finalSkuData[0].options === 'string' ?
                            JSON.parse(finalSkuData[0].options) : finalSkuData[0].options
                    });
                } else {
                    console.log(`PID ${product.pid}에 해당하는 SKU가 없습니다`);
                }

                console.log('=== SKU 데이터 가져오기 완료 ===');
            } catch (error) {
                console.error('SKU 데이터 로드 에러:', error);
            }
        };

        if (product.pid) {
            console.log('Product 객체 전체:', product);
            fetchProductSkus();
        } else {
            console.log('Product PID가 없습니다');
        }
    }, [product.pid]);

    console.log('옵션:', product.option_types);
    console.log('Product SKUs:', productSkus);
    console.log('Selected SKU:', selectedSku);

    const handleOptionChange = (optionType, value) => {
        setSelectedOptions(prev => ({
            ...prev,
            [optionType]: value
        }));
    };

    // 선택된 옵션에 맞는 SKU 찾기
    useEffect(() => {
        if (!productSkus.length || !Object.keys(selectedOptions).length) {
            setSelectedSku(null);
            return;
        }

        // product.option_types에 있는 모든 옵션이 선택되었는지 확인
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

            // 모든 필수 옵션이 일치하는지 확인
            return requiredOptions.every(optionType => {
                return skuOptions[optionType] === selectedOptions[optionType];
            });
        });

        if (matchingSku) {
            console.log('매칭된 SKU:', matchingSku.skid, matchingSku.options);
        }

        setSelectedSku(matchingSku || null);
    }, [selectedOptions, productSkus, product.option_types]);


    return (
        <>
            {/* 상품 정보 영역 */}
            <div className='product-info'>
                {/* 상품 이미지 */}
                <div>
                    <img
                        src={product.thumbnail_url}
                        alt={product.name}
                    />
                </div>
                {/* 상품 정보 */}
                <div className='info-wrap'>
                    <div className='brand'>브랜드 {product.bid}</div>
                    <div className='name'>
                        {product.name}
                        <span className='delivery'>무료배송</span>
                    </div>
                    <div className='price'>{product.price.toLocaleString('ko-KR')} 원</div>
                    <div className='price-note'>보유 M포인트 모두 사용 시 0000 원</div>
                    <div className='mpoint'>최대 {product.point_rate}% M포인트</div>


                    {/* 옵션 선택 영역 */}
                    {product.option_types && Object.keys(product.option_types).length > 0 && (
                        <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>옵션 선택</h4>
                            {Object.entries(product.option_types).map(([optionType, options]) => (
                                <div key={optionType} style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'capitalize' }}>
                                        {optionType === 'size' ? '사이즈' : optionType === 'color' ? '색상' : optionType}
                                    </label>
                                    <select
                                        value={selectedOptions[optionType] || ''}
                                        onChange={(e) => handleOptionChange(optionType, e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="">
                                            {optionType === 'size' ? '사이즈를 선택하세요' :
                                                optionType === 'color' ? '색상을 선택하세요' :
                                                    `${optionType}을 선택하세요`}
                                        </option>
                                        {options.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}

                            {/* 선택된 옵션 표시 */}
                            {Object.keys(selectedOptions).length > 0 && (
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                    <strong>선택된 옵션:</strong>
                                    {Object.entries(selectedOptions).map(([type, value]) => (
                                        value && <span key={type} style={{ marginLeft: '10px', color: '#333' }}>
                                            {type === 'size' ? '사이즈' : type === 'color' ? '색상' : type}: {value}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* 선택된 SKU 정보 표시 */}
                            {selectedSku && (
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
                                    <div><strong>SKU ID:</strong> {selectedSku.skid}</div>
                                    <div><strong>남은재고:</strong> {selectedSku.stock_qty}개</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 수량 선택 */}
                    <div>
                        <label>수량:</label>
                        <input
                            type="number"
                            min="1"
                            max={selectedSku ? selectedSku.stock_qty : 999}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{
                                border: '1px solid #ccc',
                                textAlign: 'center'
                            }}
                        />
                    </div>

                    <div className='btn-group'>
                        <button className='btn-cart'>장바구니</button>
                        <button className='btn-buy'>구매하기</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductInfo;