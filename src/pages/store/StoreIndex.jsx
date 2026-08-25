import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shop } from '../../api/shop';
import { getWeekdayLabel, getPaymentLabel, getPickupLabel } from '../../utils/labels';
import socialLine from '../../assets/social-line.png';
import socialFb from '../../assets/social-fb.png';
import socialIg from '../../assets/social-ig.svg';
import './StoreIndex.scss';

export default function StoreIndex() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [shop, setShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await Shop.GetInfo(slug);
        setShop(res.data);
        document.title = res.data.shopName ? `${res.data.shopName} | Prelo` : 'Prelo';
      } catch (err) {
        if (err?.response?.status === 404) setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShop();
  }, [slug]);

  useEffect(() => {
    if (isLoading || notFound) return;
    Shop.GetCategories(slug)
      .then((res) => setCategories(res.data?.data ?? []))
      .catch(() => {});
  }, [isLoading, notFound, slug]);

  useEffect(() => {
    if (isLoading || notFound) return;
    setProductsLoading(true);
    const params = activeCategoryId ? { category_id: activeCategoryId } : {};
    Shop.GetProducts(slug, params)
      .then((res) => setProducts(res.data?.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [isLoading, notFound, slug, activeCategoryId]);

  const activeHours = useMemo(() => shop?.businessHours?.filter((h) => h.enabled) ?? [], [shop]);
  const hasDelivery = useMemo(() => shop?.pickupMethods?.includes('delivery') ?? false, [shop]);

  if (isLoading) {
    return (
      <div className="store-page">
        <div className="hero skeleton-hero">
          <div className="skeleton-block" style={{ width: '100%', height: 180, borderRadius: 0 }} />
          <div className="hero__identity">
            <div className="skeleton-block skeleton-circle" style={{ width: 120, height: 120 }} />
            <div className="skeleton-block" style={{ width: 160, height: 28, marginTop: 12 }} />
            <div className="skeleton-block" style={{ width: 260, height: 16, marginTop: 6 }} />
          </div>
        </div>
        <div className="body">
          <div className="skeleton-block" style={{ width: '100%', height: 80, borderRadius: 8 }} />
          <div className="skeleton-block" style={{ width: '100%', height: 180, borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="store-page">
        <div className="state-center state-notfound">
          <i className="bx bx-store-alt"></i>
          <p>找不到此店家</p>
          <small>請確認網址是否正確</small>
          <button className="home-btn" onClick={() => navigate('/')}>
            回首頁
          </button>
        </div>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="store-page">
      <div className="hero">
        <div className="hero__cover">
          {shop.cover && <img src={shop.cover} alt={shop.shopName} className="hero__cover-img" />}
        </div>
        <div className="hero__identity">
          <div className="hero__avatar">
            {shop.avatar ? (
              <img src={shop.avatar} alt={shop.shopName} />
            ) : (
              <span className="hero__avatar-fallback">{shop.shopName?.[0] ?? '🍞'}</span>
            )}
          </div>
          <h1 className="hero__name">{shop.shopName}</h1>
          {shop.intro && <p className="hero__intro">{shop.intro}</p>}
        </div>
      </div>

      <div className="body">
        <div className="card">
          <div className="card__title">
            <i className="bx bx-map-pin"></i> 店家資訊
          </div>
          {shop.address && (
            <div className="info-row">
              <span className="info-row__label">地址</span>
              <span className="info-row__address">
                {shop.address}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`}
                  target="_blank"
                  rel="noopener"
                  className="map-link"
                  title="在 Google Maps 開啟"
                >
                  <i className="bx bx-map"></i>
                </a>
              </span>
            </div>
          )}
          {shop.phone && (
            <div className="info-row">
              <span className="info-row__label">電話</span>
              <span className="info-row__phone">
                {shop.phone}
                <a href={`tel:${shop.phone}`} className="call-btn" title="撥打電話">
                  <i className="bx bx-phone-call"></i>
                </a>
              </span>
            </div>
          )}
          {(shop.lineUrl || shop.facebookUrl || shop.instagramUrl) && (
            <div className="info-row">
              <span className="info-row__label">社群</span>
              <div className="social-links">
                {shop.lineUrl && (
                  <a href={shop.lineUrl} target="_blank" rel="noopener" className="social-link social-link--line" title="LINE">
                    <img src={socialLine} alt="LINE" width="30" height="30" />
                  </a>
                )}
                {shop.facebookUrl && (
                  <a href={shop.facebookUrl} target="_blank" rel="noopener" className="social-link" title="Facebook">
                    <img src={socialFb} alt="Facebook" width="30" height="30" />
                  </a>
                )}
                {shop.instagramUrl && (
                  <a href={shop.instagramUrl} target="_blank" rel="noopener" className="social-link" title="Instagram">
                    <img src={socialIg} alt="Instagram" width="30" height="30" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card__title">
            <i className="bx bx-time"></i> 營業時間
          </div>
          {activeHours.length === 0 && <div className="empty-hint">尚未設定</div>}
          {shop.businessHours?.map((h) => (
            <div key={h.day} className={`hours-row${!h.enabled ? ' hours-row--closed' : ''}`}>
              <span className="hours-row__day">週{getWeekdayLabel(h.day)}</span>
              {h.enabled ? (
                <span className="hours-row__time">
                  {h.time[0]} – {h.time[1]}
                </span>
              ) : (
                <span className="hours-row__closed">公休</span>
              )}
            </div>
          ))}
        </div>

        {(shop.paymentMethods?.length || shop.pickupMethods?.length) > 0 && (
          <div className="card">
            <div className="card__title">
              <i className="bx bx-credit-card"></i> 付款 & 取貨
            </div>
            <div className="method-group">
              {shop.paymentMethods?.length > 0 && (
                <div className="method-row">
                  <span className="method-row__label">付款</span>
                  <div className="tags">
                    {shop.paymentMethods.map((m) => (
                      <span key={m} className="tag tag--payment">
                        {getPaymentLabel(m)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {shop.pickupMethods?.length > 0 && (
                <div className="method-row">
                  <span className="method-row__label">取貨</span>
                  <div className="tags">
                    {shop.pickupMethods.map((m) => (
                      <span key={m} className="tag tag--pickup">
                        {getPickupLabel(m)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {hasDelivery && shop.shipping?.note && (
              <div className="shipping-note">
                <i className="bx bx-info-circle"></i>
                {shop.shipping.note}
              </div>
            )}
          </div>
        )}

        <div className="card card--products">
          <div className="card__title">
            <i className="bx bx-store"></i> 本店商品
          </div>

          {categories.length > 0 && (
            <div className="cat-tabs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`cat-tab${activeCategoryId === cat.id ? ' cat-tab--active' : ''}`}
                  onClick={() => setActiveCategoryId(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
              <button
                className={`cat-tab cat-tab--all${activeCategoryId === null ? ' cat-tab--all-active' : ''}`}
                onClick={() => setActiveCategoryId(null)}
              >
                全部
              </button>
            </div>
          )}

          {productsLoading && products.length === 0 ? (
            <div className="product-skeleton">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="product-skeleton__item">
                  <div className="skeleton-block" style={{ width: '100%', aspectRatio: 1, borderRadius: 8 }} />
                  <div className="skeleton-block" style={{ width: '70%', height: 14, marginTop: 8 }} />
                  <div className="skeleton-block" style={{ width: '40%', height: 14 }} />
                </div>
              ))}
            </div>
          ) : !productsLoading && products.length === 0 ? (
            <div className="empty-hint" style={{ marginTop: 4 }}>
              尚無上架商品
            </div>
          ) : (
            <div className={`product-grid-wrap${productsLoading ? ' product-grid-wrap--loading' : ''}`}>
              {productsLoading && (
                <div className="product-grid-overlay">
                  <i className="bx bx-loader-alt bx-spin"></i>
                </div>
              )}
              <div className="product-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-card__img-wrap">
                      {product.image_urls?.[0] ? (
                        <img src={product.image_urls[0]} alt={product.name} className="product-card__img" />
                      ) : (
                        <div className="product-card__img-fallback">
                          <i className="bx bx-baguette"></i>
                        </div>
                      )}
                    </div>
                    <div className="product-card__info">
                      <div className="product-card__name">{product.name}</div>
                      {product.description && <div className="product-card__desc">{product.description}</div>}
                      <div className="product-card__price">{product.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bottom-bar">
        <div className="bottom-bar__btns">
          <button className="cta-btn cta-btn--ghost" onClick={() => navigate(`/s/${slug}/orders`)}>
            <i className="bx bx-receipt"></i>
            我的訂單
          </button>
          <button className="cta-btn" onClick={() => navigate(`/s/${slug}/schedules`)}>
            <i className="bx bx-calendar-check"></i>
            我要訂購
          </button>
        </div>
        <div className="bottom-bar__powered">
          由{' '}
          <a href="/" target="_blank" rel="noopener">
            Prelo
          </a>{' '}
          提供服務
        </div>
      </div>
    </div>
  );
}
