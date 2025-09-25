import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const [activeTab, setActiveTab] = useState('notice');
  const noticeList = [
    {
      title: '· M몰 스노우피크 리빙쉘 롱Pro. 상품 정보 오등록으로 인한 주문 취소 안내',
      date: '2024.07.18'
    },
    {
      title: '· 5월 첫구매 이벤트 리워드 적립 일정 변경',
      date: '2024.06.28'
    },
    {
      title: "· 'Apple Day' 운영 방식 변경 안내 (선착순 구매 방식 적용)",
      date: '2024.04.19'
    },
    {
      title: "· 'Apple Day' 운영 방식 변경 안내",
      date: '2024.01.19'
    },
    {
      title: '· M몰 Grand Festa 럭키드로우 3차 당점차 발표(12/28일)',
      date: '2023.12.26'
    }
  ];

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
                <ul>
                  {noticeList.map((item, index) => (
                    <li key={index}>
                      <a href="#">
                        {item.title}
                        <span>{item.date}</span>
                      </a>
                    </li>
                  ))}
                </ul>
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