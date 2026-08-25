import { useEffect, useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Aside from '../../components/Aside';
import AsideMobile from '../../components/AsideMobile';
import './ShopLayout.css';

export default function ShopLayout() {
  const year = new Date().getFullYear();
  const location = useLocation();

  const [isAsideOpen, setIsAsideOpen] = useState(
    () => localStorage.getItem('isAsideOpen') !== 'false',
  );
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 640,
  );

  const toggleAside = () => setIsAsideOpen((v) => !v);

  useEffect(() => {
    localStorage.setItem('isAsideOpen', String(isAsideOpen));
  }, [isAsideOpen]);

  // 路由變化時，手機版自動隱藏側邊欄
  useEffect(() => {
    if (isMobile && isAsideOpen) {
      setIsAsideOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile && !isAsideOpen) {
      setIsAsideOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="shop">
      {!isMobile && (
        <Aside isCollapsed={!isAsideOpen} onToggle={toggleAside} />
      )}
      <main className={`main-content${isMobile ? ' is-mobile' : ''}`}>
        {!isMobile && !isAsideOpen && (
          <button
            className="aside-toggle-tag"
            type="button"
            aria-label="Open aside menu"
            onClick={toggleAside}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        )}
        <div className="container">
          <Outlet />
          <footer className="shop-footer">
            <span>© {year} Prelo 鋪樂</span>
            <nav>
              <Link to="/terms">服務條款</Link>
              <span className="sep" />
              <Link to="/privacy">隱私權政策</Link>
              <span className="sep" />
              <a href="https://lin.ee/7cl17b6" target="_blank" rel="noopener" className="shop-footer__line">
                聯繫客服
              </a>
            </nav>
          </footer>
        </div>
        {isMobile && <AsideMobile />}
      </main>
    </div>
  );
}
