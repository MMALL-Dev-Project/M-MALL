import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Swiper 스타일
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// 커스텀 스타일
import './Home.css';

const Home = () => {
    // 서비스 준비중
    const handleComingSoon = (e) => {
        e.preventDefault();
        alert(
            '🚧 서비스 준비중입니다 🚧\n\n' +
            '현재 가능한 서비스:\n' +
            '✅ 회원가입\n' +
            '✅ 로그인\n' +
            '✅ 프로필 수정\n' +
            '✅ 비밀번호 변경\n' +
            '✅ 상품 검색\n' +
            '✅ 좋아요\n' +
            '✅ 주문\n' +
            '✅ 리뷰 작성'
        );
    };

    // 메인 슬라이더 이미지 데이터
    const mainVisualImages = [
        {
            id: 1,
            src: `${import.meta.env.BASE_URL}images/mainVisual4.png`,
            alt: 'rare book room',
            link: '#'
        },
        {
            id: 2,
            src: `${import.meta.env.BASE_URL}images/mainVisual.png`,
            alt: 'rare book room',
            link: '#'
        },
        {
            id: 3,
            src: `${import.meta.env.BASE_URL}images/mainVisual2.png`,
            alt: 'rare book room',
            link: '#'
        },
        {
            id: 4,
            src: `${import.meta.env.BASE_URL}images/mainVisual3.png`,
            alt: 'rare book room',
            link: '#'
        }
    ];

    // 스페셜 쇼케이스 데이터
    const specialShowcase = [
        {
            id: 1,
            image: `${import.meta.env.BASE_URL}images/cont1_1.png`,
            hoverTitle: 'Collaboration with Guud',
            hoverBrand: 'made by GUUD',
            hoverDesc: '굿닷컴의 감성과 브랜드의 철학이 만나면\n더 큰 가치가 탄생합니다. 굳닷컴이 추천하는\n브랜드의 우수한 품질과 감각적인 디자인을\n단독 기획 상품으로 만나 보세요.',
            title: '굳닷컴',
            subtitle: '리빙&라이프스타일 큐레이션몰',
            point: '최대 50% M포인트',
            link: '#'
        },
        {
            id: 2,
            image: `${import.meta.env.BASE_URL}images/cont1_2.png`,
            hoverTitle: 'Better Materials',
            hoverBrand: 'earth by MUSINSA',
            hoverDesc: '무신사 어스는 브랜드가 사회·환경적으로\n더 나은 선택을 하기 위해 노력하고 있는지,\n지속가능성을 지향하고 있는지 확인합니다.\n또한 모든 상품이 무신사 어스 기준을\n충족하는 브랜드를 입점 우선순위로 합니다.',
            title: '무신사 어스',
            subtitle: '지속가능 라이프스타일 전문관',
            point: '최대 100% M포인트',
            link: '#'
        },
        {
            id: 3,
            image: `${import.meta.env.BASE_URL}images/cont1_3.png`,
            hoverTitle: 'Why tren:be?',
            hoverBrand: 'tren:be',
            hoverDesc: '이제 M몰에서 글로벌 명품 쇼핑 플랫폼\n트렌비를 만나 보세요.\n합리적인 가격의 명품을 안심하고 구매할 수 있도록,\n트렌비는 구매 전부터 이후까지 케어합니다.',
            title: '트렌비',
            subtitle: '글로벌 명품 쇼핑 플랫폼',
            point: '최대 50% M포인트',
            link: '#'
        },
        {
            id: 4,
            image: `${import.meta.env.BASE_URL}images/cont1_4.png`,
            hoverTitle: 'Curated for the Red',
            hoverBrand: 'the Red',
            hoverDesc: '핫 럭셔리 the Red에게 제안합니다.\n오직 the Red에게만 허락된 프리미엄으로\n럭셔리 라이프를 완성해보세요.',
            title: 'the Red',
            subtitle: 'Curated for the Red',
            subtitleClass: 'red',
            point: '최대 50% M포인트',
            link: '#'
        },
        {
            id: 5,
            image: `${import.meta.env.BASE_URL}images/cont1_5.png`,
            hoverTitle: 'Curated for the Green',
            hoverBrand: 'the Green',
            hoverDesc: '모험을 즐기는 the Green에게 제안합니다.\nthe Green의 자유로운 라이프 스타일을 반영한\n호텔·고메·여행 아이템을 경험해 보세요.',
            title: 'the Green',
            subtitle: 'Curated for the Green',
            subtitleClass: 'green',
            point: '최대 50% M포인트',
            link: '#'
        }
    ];

    return (
        <main className="home-main">
            {/* 메인 비주얼 슬라이더 */}
            <Swiper
                className="main-visual"
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{
                    delay: 4000,
                    disableOnInteraction: false,
                }}
                loop={true}
            >
                {mainVisualImages.map((image) => (
                    <SwiperSlide key={image.id}>
                        <a href="#" onClick={handleComingSoon}>
                            <img src={image.src} alt={image.alt} />
                        </a>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* CONT1 - 스페셜 쇼케이스 */}
            <div className="cont1">
                <h2>스페셜 쇼케이스</h2>
                <Swiper
                    className="cont1-list"
                    modules={[Navigation]}
                    spaceBetween={20}
                    slidesPerView={4}
                    navigation
                >
                    {specialShowcase.map((item) => (
                        <SwiperSlide key={item.id}>
                            <div className="cont1-slide">
                                <div className="cont-img">
                                    <img src={item.image} alt={item.title} />
                                </div>
                                <div className="img-txt">
                                    <p><span>{item.hoverTitle}</span></p>
                                    <p className="brand-name">{item.hoverBrand}</p>
                                    <p style={{ whiteSpace: 'pre-line' }}>{item.hoverDesc}</p>
                                </div>
                                <div className="cont1-txt">
                                    <h3><a href="#" onClick={handleComingSoon}>{item.title}</a></h3>
                                    <p className={`color ${item.subtitleClass || ''}`}>
                                        {item.subtitleClass ? (
                                            <>Curated for <span>{item.title}</span></>
                                        ) : (
                                            item.subtitle
                                        )}
                                    </p>
                                    <p><span>{item.point}</span></p>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* 여기에 다음 섹션들이 추가될 예정 */}
        </main>
    );
};

export default Home;