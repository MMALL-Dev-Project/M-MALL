import { supabase } from '@config/supabase';

/**
 * SKU 코드 생성
 */
export const generateSkuCode = (productName, options) => {
    const prefix = productName.substring(0, 3).toUpperCase() || 'PRD';
    const optionStr = Object.entries(options)
        .map(([key, value]) => `${key.toUpperCase()}-${value}`)
        .join('-');
    return optionStr ? `${prefix}-${optionStr}` : `${prefix}-DEFAULT`;
};

/**
 * 상품 기본 정보 유효성 검사
 */
export const validateProduct = (product) => {
    if (!product.name || !product.price) {
        return { valid: false, message: '상품명과 가격은 필수입니다.' };
    }

    if (!product.cid || !product.scid) {
        return { valid: false, message: '카테고리를 선택해주세요.' };
    }

    return { valid: true };
};

/**
 * SKU 유효성 검사
 */
export const validateSkus = (skus, hasOptions) => {
    if (skus.length === 0) {
        return {
            valid: false,
            message: hasOptions ? 'SKU를 생성해주세요.' : '재고 정보를 입력해주세요.'
        };
    }

    return { valid: true };
};

/**
 * 이미지 업로드 (썸네일)
 */
export const uploadThumbnail = async (file) => {
    if (!file) return null;

    const thumbnailPath = `thumbnails/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
        .from('products')
        .upload(thumbnailPath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(thumbnailPath);

    return publicUrl;
};

/**
 * 이미지 업로드 (상세 이미지 여러 개)
 */
export const uploadDetailImages = async (files) => {
    if (!files || files.length === 0) return [];

    const imageUrls = [];
    for (const file of files) {
        const imagePath = `details/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage
            .from('products')
            .upload(imagePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(imagePath);

        imageUrls.push(publicUrl);
    }

    return imageUrls;
};

/**
 * 옵션 타입을 객체로 변환
 */
export const convertOptionsToObject = (optionTypes) => {
    const optionTypesObj = {};
    optionTypes.forEach(opt => {
        optionTypesObj[opt.type] = opt.values;
    });
    return optionTypesObj;
};

/**
 * 상품 데이터 준비 (DB 저장용)
 */
export const prepareProductData = (product, thumbnailUrl, imageUrls, optionTypesObj, hasOptions, skus) => {
    // 모든 SKU의 재고가 0인지 확인
    const allSkusOutOfStock = skus.every(sku => {
        const stockQty = parseInt(sku.stock_qty) || 0;
        return stockQty === 0;
    });

    return {
        name: product.name,
        price: parseInt(product.price),
        point_rate: parseInt(product.point_rate),
        cid: parseInt(product.cid),
        scid: parseInt(product.scid),
        bid: product.bid ? parseInt(product.bid) : null,
        thumbnail_url: thumbnailUrl,
        images: imageUrls.length > 0 ? imageUrls : null,
        option_types: hasOptions ? optionTypesObj : null,
        is_active: allSkusOutOfStock ? false : product.is_active,
        like_count: 0
    };
};

/**
 * SKU 데이터 준비 (DB 저장용)
 */
export const prepareSkuData = (skus, productId, hasOptions) => {
    return skus.map(sku => {
        const stockQty = parseInt(sku.stock_qty) || 0;

        return {
            pid: productId,
            options: hasOptions ? sku.options : {},
            sku_code: sku.sku_code,
            additional_price: parseInt(sku.additional_price) || 0,
            stock_qty: stockQty,
            reserved_qty: 0,
            is_active: stockQty > 0
        };
    });
};