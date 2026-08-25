import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from 'antd';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import FooterBar from '../components/FooterBar';
import logo from '../assets/logo.png';
import demoImg1 from '../assets/demo/1.jpg';
import demoImg2 from '../assets/demo/2.jpg';
import demoImg3 from '../assets/demo/3.jpg';
import demoM1 from '../assets/demo/m1.jpg';
import demoM2 from '../assets/demo/m2.jpg';
import demoM3 from '../assets/demo/m3.jpg';
import demoM4 from '../assets/demo/m4.jpg';
import demoM5 from '../assets/demo/m5.jpg';
import demoM6 from '../assets/demo/m6.jpg';
import demoM7 from '../assets/demo/m7.jpg';
import './Landing.scss';

const painPoints = [
  { text: '用 LINE 一筆一筆確認訂單，回覆到手痠' },
  { text: '手動整理訂單容易漏單，錯誤難以避免' },
  { text: '反覆回答相同問題，佔用大量寶貴時間' },
  { text: '訂單散落各處，統計出貨頭皮發麻' },
];

const steps = [
  { title: '建立商品與預購期程', desc: '上架商品、設定預購開放日期與每日數量上限，幾分鐘即可完成' },
  { title: '分享專屬連結', desc: '將你的店鋪連結傳給客人，無需下載 App，直接在瀏覽器下單' },
  { title: '客人自助下單，後台輕鬆管理', desc: '訂單自動彙整到後台，出貨狀態即時更新，不再漏單' },
];

const features = [
  { title: '預購期程管理', desc: '彈性設定開放時段與每日限量，系統自動幫你管控，輕鬆掌握接單節奏' },
  { title: '商品上架', desc: '支援多商品分類，圖文並茂讓客人一目了然，隨時調整規格與售價' },
  { title: '訂單彙整', desc: '所有訂單集中顯示，確認出貨狀態不再手忙腳亂，一個頁面管理所有訂單' },
  { title: '客人自助查詢', desc: '客人用手機號碼即可自助查詢訂單狀態，大幅減少客服時間' },
  { title: 'LINE 即時訂單通知', desc: '客人下單的瞬間，LINE 立即推播通知到您手機，商品明細一目了然，再也不漏接一筆' },
];

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ChevronIcon({ direction }) {
  const points = direction === 'left' ? '14 6 8 12 14 18' : '10 6 16 12 10 18';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={points} />
    </svg>
  );
}

const featureIcons = [
  <svg key="0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="14" x2="8" y2="14" />
    <line x1="12" y1="14" x2="12" y2="14" />
    <line x1="8" y1="18" x2="8" y2="18" />
    <line x1="12" y1="18" x2="12" y2="18" />
  </svg>,
  <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="3.5" cy="6" r="1" />
    <circle cx="3.5" cy="12" r="1" />
    <circle cx="3.5" cy="18" r="1" />
  </svg>,
  <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="2" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="12" y2="16" />
  </svg>,
  <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>,
  <svg key="4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="9" y1="10" x2="9" y2="10" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="12" y1="10" x2="12" y2="10" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="15" y1="10" x2="15" y2="10" strokeWidth="2.5" strokeLinecap="round" />
  </svg>,
];

export default function Landing() {
  const navigate = useNavigate();
  const [previewMode, setPreviewMode] = useState('pc');

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="lp-wrap">
      <nav className="lp-nav">
        <button className="lp-nav__logo" onClick={() => navigate('/')} style={{ backgroundImage: `url(${logo})` }} />
        <div className="lp-nav__actions">
          <Button className="lp-nav__login" onClick={() => navigate('/login')}>
            登入
          </Button>
          <Button className="lp-nav__register" onClick={() => navigate('/register')}>
            免費開店
          </Button>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero__inner">
          <p className="lp-eyebrow">小店家最愛・預購訂單管理工具</p>
          <h1 className="lp-hero__title">
            客人自助下單
            <br />
            你輕鬆接單
          </h1>
          <p className="lp-hero__sub">
            不用再 LINE 來 LINE 去
            <br />
            5 分鐘建立你的專屬訂購頁，免費開始使用
          </p>
          <div className="lp-hero__actions">
            <Button className="lp-btn-primary lp-btn-lg" onClick={() => navigate('/register')}>
              立即免費開店
            </Button>
            <Button className="lp-btn-ghost lp-btn-lg" onClick={() => scrollTo('lp-how')}>
              了解更多
            </Button>
          </div>
          <div className="lp-hero__trust">
            <span className="lp-trust-badge">
              <CheckIcon />
              不接手金流
            </span>
            <span className="lp-trust-dot" />
            <span className="lp-trust-badge">
              <ShieldIcon />
              資料安全無虞
            </span>
            <span className="lp-trust-dot" />
            <span className="lp-trust-badge">
              <CheckIcon />
              免費使用
            </span>
          </div>
        </div>

        <div className="lp-hero__stats">
          <div className="lp-stats__item">
            <span className="lp-stats__num">
              網頁 <span className="lp-stats__unit">下單</span>
            </span>
            <span className="lp-stats__label">客人用連結直接下單，免安裝APP</span>
          </div>
          <div className="lp-stats__sep" />
          <div className="lp-stats__item">
            <span className="lp-stats__num">
              手機 <span className="lp-stats__unit">平板</span>
            </span>
            <span className="lp-stats__label">跨裝置隨時管理</span>
          </div>
          <div className="lp-stats__sep" />
          <div className="lp-stats__item">
            <span className="lp-stats__num">
              5 <span className="lp-stats__unit">分鐘</span>
            </span>
            <span className="lp-stats__label">即可完成開店</span>
          </div>
          <div className="lp-stats__sep" />
          <div className="lp-stats__item">
            <span className="lp-stats__num">
              無 <span className="lp-stats__unit">綁約</span>
            </span>
            <span className="lp-stats__label">隨時可以取消</span>
          </div>
        </div>
      </section>

      <section className="lp-pain">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-eyebrow--dark">你是否還在...</p>
          <h2 className="lp-section-title">靠社群平台一筆筆手動收訂單？</h2>
          <div className="lp-pain__grid">
            {painPoints.map((item) => (
              <div key={item.text} className="lp-pain__card">
                <div className="lp-pain__x">✕</div>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
          <div className="lp-pain__divider">
            <span>Prelo，讓這一切成為過去</span>
          </div>
        </div>
      </section>

      <section className="lp-how" id="lp-how">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-eyebrow--dark">三步驟上線</p>
          <h2 className="lp-section-title">開店超簡單</h2>
          <div className="lp-how__steps">
            {steps.map((step, i) => (
              <div key={i} className="lp-how__step">
                <div className="lp-how__num">{i + 1}</div>
                <div className="lp-how__body">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
                {i < steps.length - 1 && <div className="lp-how__line" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-preview">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-eyebrow--dark">產品截圖</p>
          <h2 className="lp-section-title">清楚好用的管理後台</h2>
          <div className="lp-preview__toggle">
            <button
              className={`lp-preview__toggle-btn${previewMode === 'pc' ? ' active' : ''}`}
              onClick={() => setPreviewMode('pc')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <polyline points="8 21 12 17 16 21" />
              </svg>
              PC / 平板
            </button>
            <button
              className={`lp-preview__toggle-btn${previewMode === 'mobile' ? ' active' : ''}`}
              onClick={() => setPreviewMode('mobile')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              手機
            </button>
          </div>

          {previewMode === 'pc' ? (
            <div className="lp-preview__browser">
              <div className="lp-preview__bar">
                <div className="lp-preview__dots">
                  <span className="lp-preview__dot lp-preview__dot--red" />
                  <span className="lp-preview__dot lp-preview__dot--yellow" />
                  <span className="lp-preview__dot lp-preview__dot--green" />
                </div>
                <div className="lp-preview__url">您的專屬連結</div>
              </div>
              <div className="lp-preview__screen">
                <Swiper
                  modules={[Autoplay, Navigation]}
                  autoplay={{ delay: 4000, disableOnInteraction: false }}
                  navigation={{ prevEl: '.lp-preview__nav--prev', nextEl: '.lp-preview__nav--next' }}
                  loop
                >
                  <SwiperSlide>
                    <img src={demoImg1} alt="接單排程" className="lp-preview__img" />
                  </SwiperSlide>
                  <SwiperSlide>
                    <img src={demoImg2} alt="訂單管理" className="lp-preview__img" />
                  </SwiperSlide>
                  <SwiperSlide>
                    <img src={demoImg3} alt="產品管理" className="lp-preview__img" />
                  </SwiperSlide>
                  <button className="lp-preview__nav lp-preview__nav--prev" aria-label="上一張">
                    <ChevronIcon direction="left" />
                  </button>
                  <button className="lp-preview__nav lp-preview__nav--next" aria-label="下一張">
                    <ChevronIcon direction="right" />
                  </button>
                </Swiper>
              </div>
            </div>
          ) : (
            <div className="lp-preview__phone-view">
              <Swiper
                modules={[Autoplay, Navigation]}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                navigation={{ prevEl: '.lp-preview__nav--prev', nextEl: '.lp-preview__nav--next' }}
                loop
              >
                <SwiperSlide>
                  <img src={demoM1} alt="商店首頁" className="lp-preview__img" />
                </SwiperSlide>
                <SwiperSlide>
                  <img src={demoM2} alt="接單行程" className="lp-preview__img" />
                </SwiperSlide>
                <SwiperSlide>
                  <img src={demoM3} alt="訂購頁面" className="lp-preview__img" />
                </SwiperSlide>
                <SwiperSlide>
                  <img src={demoM4} alt="下單成功" className="lp-preview__img" />
                </SwiperSlide>
                <SwiperSlide>
                  <img src={demoM5} alt="查詢訂單" className="lp-preview__img" />
                </SwiperSlide>
                <SwiperSlide>
                  <img src={demoM6} alt="訂單管理" className="lp-preview__img" />
                </SwiperSlide>
                <SwiperSlide>
                  <img src={demoM7} alt="訂單管理" className="lp-preview__img" />
                </SwiperSlide>
                <button className="lp-preview__nav lp-preview__nav--prev" aria-label="上一張">
                  <ChevronIcon direction="left" />
                </button>
                <button className="lp-preview__nav lp-preview__nav--next" aria-label="下一張">
                  <ChevronIcon direction="right" />
                </button>
              </Swiper>
            </div>
          )}
        </div>
      </section>

      <section className="lp-features">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-eyebrow--dark">核心功能</p>
          <h2 className="lp-section-title">一站式預購管理</h2>
          <div className="lp-features__grid">
            {features.map((feature, i) => (
              <div key={feature.title} className={`lp-feat-card${i === 4 ? ' lp-feat-card--line' : ''}`}>
                <div className={`lp-feat-card__icon${i === 4 ? ' lp-feat-card__icon--line' : ''}`}>{featureIcons[i]}</div>
                {i === 4 && <div className="lp-feat-card__new">NEW</div>}
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
            <div className="lp-feat-card lp-feat-card--coming">
              <div className="lp-feat-card__icon lp-feat-card__icon--coming">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="lp-feat-card__coming">敬請期待</div>
              <h3>更多功能開發中</h3>
              <p>銷售統計、訂單匯出 CSV、多元付款方式…持續更新中。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-cta__inner">
          <p className="lp-eyebrow">立即加入</p>
          <h2 className="lp-cta__title">準備好了嗎？</h2>
          <p className="lp-cta__sub">建立你的預購頁面，免費開始使用。</p>
          <Button className="lp-btn-primary lp-btn-lg" onClick={() => navigate('/register')}>
            立即免費開店
          </Button>
          <p className="lp-cta__hint">免費使用，隨時可以取消</p>
        </div>
      </section>

      <div className="lp-disclaimer">
        <p>
          Prelo 目前<strong>免費開放使用</strong>，功能持續更新中。服務內容或收費政策日後可能調整，使用前請詳閱
          <Link to="/terms">服務條款</Link>
          及
          <Link to="/privacy">隱私權政策</Link>；因系統因素造成之損失，本平台恕不負責。
        </p>
      </div>

      <FooterBar />
    </div>
  );
}
