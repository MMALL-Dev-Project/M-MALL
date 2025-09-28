import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@config/supabase';
import { getLogoSrc } from '@/utils/image';
import './Brand.css';


const Brand = () => {
    // URL 파라미터에서 브랜드 bid 추출
    const { bid } = useParams();
    const [brand, setBrand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBrand = async () => {
            try {
                setLoading(true);

                const { data: data, error: error } = await supabase
                    .from('brands')
                    .select(`
                            *,
                            products(name, pid, thumbnail_url)
                        `)
                    .eq('bid', bid)
                    .single();

                if (error) {
                    setError('브랜드를 찾을 수 없습니다.');
                    return;
                }

                setBrand(data);


            } catch (error) {
                console.error('브랜드 데이터 로드 에러:', error);
                setError('브랜드 정보를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (bid) {
            fetchBrand();
        }
    }, [bid]);
    console.log(brand);

    if (loading) return <div>Loading</div>;
    if (error) return <div>error</div>;

    return (
        <div id='brand-wrap'>
            <div className='brand-info-wrap'>
                <img src={getLogoSrc(brand.logo_url)} alt={brand.name} className='logo' />
                <h2>{brand.name}</h2>
            </div>
        </div>
    );
};

export default Brand;