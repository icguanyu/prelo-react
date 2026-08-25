import { Link } from 'react-router-dom';
import './FooterBar.scss';

export default function FooterBar() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <span className="footer__copy">© {year} Prelo 鋪樂</span>
      <nav className="footer__links">
        <Link to="/">回到首頁</Link>
        <span className="footer__sep" />
        <Link to="/terms">服務條款</Link>
        <span className="footer__sep" />
        <Link to="/privacy">隱私權政策</Link>
        <span className="footer__sep" />
        <a
          href="https://lin.ee/7cl17b6"
          target="_blank"
          rel="noopener"
          className="footer__line"
        >
          聯繫客服
        </a>
      </nav>
    </footer>
  );
}
