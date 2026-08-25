// antd ConfigProvider 主題 token，對應 Vue 版 src/assets/scss/_colors.scss 的品牌配色
export const antdTheme = {
  token: {
    colorPrimary: "#454BE1",
    colorPrimaryHover: "#3940CC",
    colorInfo: "#454BE1",
    colorSuccess: "#10b95c",
    colorWarning: "#f59e0b",
    colorError: "#C0392B",
    colorTextBase: "#252525",
    colorBgLayout: "#f6f6f6",
    borderRadius: 8,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif',
  },
  components: {
    Button: {
      controlHeight: 36, // 預設32
    },
    Input:{
      controlHeight: 36, // 預設32
    }
  },
};
