import { useNavigate } from 'react-router-dom';
import FooterBar from '../components/FooterBar';
import logo from '../assets/logo.png';
import './Doc.scss';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="doc-wrap">
      <nav className="doc-nav">
        <button className="doc-nav__logo" onClick={() => navigate('/')} style={{ backgroundImage: `url(${logo})` }} />
      </nav>

      <main className="doc-main">
        <div className="doc-inner">
          <h1>隱私權政策</h1>
          <p className="doc-meta">最後更新日期：2026 年 6 月 6 日</p>

          <p>
            鋪樂（以下簡稱「本服務」、「我們」）非常重視您的隱私。本隱私權政策說明我們如何蒐集、使用及保護您的個人資料。使用本服務即表示您同意本政策之內容。
          </p>

          <h2>一、蒐集的資料</h2>
          <h3>店家帳號</h3>
          <ul>
            <li>店名</li>
            <li>電子郵件地址</li>
            <li>登入密碼（經加密儲存，我們無法讀取明文）</li>
          </ul>
          <h3>客人下單資料</h3>
          <ul>
            <li>姓名</li>
            <li>手機號碼</li>
            <li>訂單內容（品項、數量、取貨日期）</li>
            <li>備註（選填）</li>
          </ul>

          <h2>二、資料的使用方式</h2>
          <ul>
            <li>提供及維運本服務的核心功能</li>
            <li>讓客人能查詢自己的訂單狀態</li>
            <li>傳送帳號相關的系統通知（如密碼重設）</li>
            <li>分析服務使用狀況，以持續改善產品品質</li>
            <li>履行法律義務或回應主管機關要求</li>
          </ul>

          <h2>三、資料的分享與揭露</h2>
          <p>我們不會將您的個人資料出售或出租給第三方。以下情形除外：</p>
          <ul>
            <li>
              <strong>服務維運需要</strong>：我們使用 Google Cloud（雲端運算與資料庫托管）來運作本服務。這些服務商僅依我們的指示處理資料，且受合約保護。
            </li>
            <li>
              <strong>法律要求</strong>：依法院命令或政府主管機關的合法要求予以揭露。
            </li>
            <li>
              <strong>保護權益</strong>：為防止詐欺或保護本服務及使用者的安全。
            </li>
          </ul>
          <p>請注意，客人的訂單資料會提供給該訂單所屬的店家，此為本服務運作之必要。</p>

          <h2>四、金流聲明</h2>
          <p>
            鋪樂平台<strong>不處理任何付款交易</strong>。所有款項往來均直接在店家與客人之間進行，本服務不涉及，亦不儲存任何信用卡或金融帳戶資訊。
          </p>

          <h2>五、您的權利</h2>
          <p>依據中華民國《個人資料保護法》，您有權：</p>
          <ul>
            <li>查詢或請求閱覽您的個人資料</li>
            <li>請求補充或更正</li>
            <li>請求停止蒐集、處理或利用</li>
            <li>請求刪除</li>
          </ul>
          <p>如需行使上述權利，請透過下方聯絡方式與我們聯繫。</p>

          <h2>六、Cookie 與追蹤技術</h2>
          <p>本服務使用 Cookie 及 localStorage 儲存您的登入狀態。我們不使用第三方廣告追蹤 Cookie。</p>

          <h2>七、本政策的修訂</h2>
          <p>我們可能不定期修訂本政策。重大變更將在本頁面公告，並更新頂部的「最後更新日期」。繼續使用本服務即表示接受修訂後的政策。</p>

          <h2>八、聯絡我們</h2>
          <p>如對本隱私權政策有任何疑問，請聯絡：</p>
          <p>
            <strong>鋪樂 Prelo</strong>
            <br />
            電子郵件：<a href="mailto:icguanyu@gmail.com">icguanyu@gmail.com</a>
          </p>
        </div>
      </main>

      <FooterBar />
    </div>
  );
}
