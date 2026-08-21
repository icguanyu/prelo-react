import { Outlet } from 'react-router-dom';
import NavSync from './NavSync';

export default function RootLayout() {
  return (
    <>
      <NavSync />
      <Outlet />
    </>
  );
}
