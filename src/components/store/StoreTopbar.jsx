import { useNavigate, useParams } from 'react-router-dom';
import './StoreTopbar.scss';

export default function StoreTopbar({ title, subtitle = null, showHome = true }) {
  const navigate = useNavigate();
  const { slug } = useParams();

  return (
    <div className="store-topbar">
      <button className="store-topbar__btn" onClick={() => navigate(-1)}>
        <i className="bx bx-chevron-left"></i>
      </button>
      <div className="store-topbar__center">
        <span className="store-topbar__title">{title}</span>
        {subtitle && <span className="store-topbar__subtitle">{subtitle}</span>}
      </div>
      {showHome ? (
        <button className="store-topbar__btn" onClick={() => navigate(`/s/${slug}`)}>
          <i className="bx bx-store"></i>
        </button>
      ) : (
        <span className="store-topbar__spacer"></span>
      )}
    </div>
  );
}
