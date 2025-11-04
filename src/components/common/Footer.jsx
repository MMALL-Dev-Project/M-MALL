import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { supabase } from '@/config/supabase';

const Footer = () => {
  const [activeTab, setActiveTab] = useState('notice');
  // DB에서 공지 가져오기
  const [noticeList, setNoticeList] = useState([]);
  const [loading, setLoading] = useState(true);

  const eventList = [
    {
      title: '· M몰에서 첫 구매하고 웰컴 리워드 받아 보세요!',
      date: '2024.08.09'
    },
    {
      title: '· 여름맞이 프로모션',
      date: '2024.06.10'
    },
    {
      title: '· 회원 전용 이벤트',
      date: '2024.04.19'
    }
  ];

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);

      // notices 테이블에서 활성화된 공지사항 5개만 가져오기
      const { data, error } = await supabase
        .from('notices')
        .select('nid, title, created_at')
        .eq('is_active', true)
        .order('is_important', { ascending: false }) // 중요 공지 우선
        .order('created_at', { ascending: false }) // 최신순
        .limit(5);

      if (error) throw error;

      // 날짜 형석
      const formattedData = data.map(notice => ({
        nid: notice.nid,
        title: `· ${notice.title}`,
        date: new Date(notice.created_at).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\. /g, '.').replace(/\.$/, '')
      }));

      setNoticeList(formattedData);
    } catch (error) {
      console.error('공지사항 불러오기 오류:', error);
      // 에러 시 빈 배열로 설정
      setNoticeList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tab, e) => {
    e.preventDefault();
    setActiveTab(tab);
  };

  // TOP 버튼 클릭 핸들러
  const handleTopClick = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id='footer'>
      <div className="footerWrap">
        {/* 푸터 왼쪽 */}
        <div className="footerLeft">
          <p>
            <img src={`${import.meta.env.BASE_URL}images/footer/footerLogo.png`} alt="M-Mall" />
          </p>
          <ul>
            <li className="appLink">
              <ul>
                <li>
                  <img src={`${import.meta.env.BASE_URL}images/footer/footerAppStore.png`} alt="앱 스토어" />
                </li>
                <li>
                  <img src={`${import.meta.env.BASE_URL}images/footer/footerGooglePlay.png`} alt="구글 플레이스토어" />
                </li>
              </ul>
            </li>
            <li className="qrCode">
              <img src={`${import.meta.env.BASE_URL}images/footer/footerQR.png`} alt="QR코드" />
            </li>
          </ul>
        </div>

        {/* 푸터 오른쪽 */}
        <div className="footerRight">
          <div className="rightCenter">
            <div className="centerTop">
              {/* 탭 메뉴 */}
              <div className="tap">
                <Link
                  to="/support/notice"
                  className={`notice ${activeTab === 'notice' ? 'active' : ''}`}
                >
                  공지사항
                </Link>
                <a
                  href="#"
                  className={`event ${activeTab === 'event' ? 'active' : ''}`}
                  onClick={(e) => handleTabClick('event', e)}
                >
                  이벤트
                </a>
              </div>

              {/* 공지사항 리스트 */}
              <div className={`noticeList ${activeTab === 'notice' ? '' : 'hidden'}`}>
                {loading ? (
                  <p>로딩중...</p>
                ) : (
                  <ul>
                    {noticeList.length > 0 ? (
                      noticeList.map((item) => (
                        <li key={item.nid}>
                          <Link to={`/support/notice/${item.nid}`}>
                            {item.title}
                            <span>{item.date}</span>
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li>공지사항이 없습니다.</li>
                    )}
                  </ul>
                )}
              </div>

              {/* 이벤트 리스트 */}
              <div className={`eventList ${activeTab === 'event' ? '' : 'hidden'}`}>
                <ul>
                  {eventList.map((item, index) => (
                    <li key={index}>
                      <a href="#">
                        {item.title}
                        <span>{item.date}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 약관 및 정책 */}
            <div className="centerBottom">
              <dl>
                <dt><a href="#">약관 및 정책</a></dt>
                <dd><a href="#">이용약관</a></dd>
                <dd><a href="#">개인정보처리방침</a></dd>
                <dd><a href="#">고객권리안내</a></dd>
              </dl>
              <dl>
                <dt><a href="#">MY ACCOUNT</a></dt>
                <dd><Link to="/mypage">회원정보 수정</Link></dd>
                <dd><Link to="/mypage">회원등급</Link></dd>
                <dd><Link to="/mypage">M포인트 현황</Link></dd>
                <dd><Link to="/mypage">쿠폰</Link></dd>
              </dl>
              <dl>
                <dt><a href="#">FAMILY SITE +</a></dt>
              </dl>
            </div>
          </div>

          {/* 고객센터 */}
          <div className="rightR">
            <div className="csCenter">
              <h3>고객센터</h3>
              <p className="csNumber">1577-5141</p>
              <p className="csHours">평일 9:00 - 18:00(주말 공휴일 제외)</p>
            </div>
            <div className="contact">
              <h3>
                1:1 문의 <img src={`${import.meta.env.BASE_URL}images/icons/ico_mail.png`} alt="메일" />
              </h3>
              <p>업무시간 외에는 1:1 문의를 이용하세요.</p>
              <p className="mailAddress">mpointmall@hyundaicard.com</p>
            </div>
            <div className="button">
              <a href="#">자주 하는 질문</a>
              <a href="#">M몰 입점 문의</a>
            </div>
          </div>
        </div>
      </div>

      {/* 회사 정보 */}
      <div className="footerInforWrap">
        <img src={`${import.meta.env.BASE_URL}images/footer/footerCardLogo.png`} alt="현대카드" />
        <ul className="footerInfor">
          <li>
            백유선
            <span>
              (<a href="https://github.com/yuseon4455" target='_blank'>GitHub</a>)
            </span>
          </li>
          <li>
            김환희
            <span>
              (<a href="https://github.com/rlaksl" target='_blank'>GitHub</a>)
            </span>
          </li>
          <li>
            김예지
            <span>
              (<a href="https://github.com/yjkdev21" target='_blank'>GitHub</a>)
            </span>
          </li>
        </ul>
        <p>ⓒ HYUNDAI CARD Corp.</p>
      </div>
    </footer>

  );
}

export default Footer;