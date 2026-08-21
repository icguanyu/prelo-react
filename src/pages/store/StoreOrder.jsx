import { useParams } from 'react-router-dom';

export default function StoreOrder() {
  const { slug, date } = useParams();
  return (
    <div style={{ padding: 24 }}>
      Store {slug} order for {date}（待實作）
    </div>
  );
}
