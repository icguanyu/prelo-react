import { ConfigProvider, App as AntdApp } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { antdTheme } from './theme';

function App() {
  return (
    <ConfigProvider theme={antdTheme} locale={zhTW}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
