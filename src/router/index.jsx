import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './RootLayout';
import RequireAuth from './RequireAuth';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Terms from '../pages/Terms';
import Privacy from '../pages/Privacy';
import StoreIndex from '../pages/store/StoreIndex';
import StoreSchedules from '../pages/store/StoreSchedules';
import StoreOrder from '../pages/store/StoreOrder';
import StoreOrderLookup from '../pages/store/StoreOrderLookup';
import ShopLayout from '../pages/shop/ShopLayout';
import ShopOrder from '../pages/shop/ShopOrder';
import ShopProducts from '../pages/shop/ShopProducts';
import ShopSchedule from '../pages/shop/ShopSchedule';
import ShopSettings from '../pages/shop/ShopSettings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'terms', element: <Terms /> },
      { path: 'privacy', element: <Privacy /> },
      { path: 's/:slug', element: <StoreIndex /> },
      { path: 's/:slug/schedules', element: <StoreSchedules /> },
      { path: 's/:slug/schedules/:date', element: <StoreOrder /> },
      { path: 's/:slug/orders', element: <StoreOrderLookup /> },
      {
        path: 'shop',
        element: <RequireAuth />,
        children: [
          {
            element: <ShopLayout />,
            children: [
              { index: true, element: <ShopOrder /> },
              { path: 'products', element: <ShopProducts /> },
              { path: 'order', element: <ShopSchedule /> },
              { path: 'settings', element: <ShopSettings /> },
            ],
          },
        ],
      },
    ],
  },
]);
