import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ConfigProvider, App as AntdApp } from "antd"
import esES from "antd/locale/es_ES"
import App from "./App.jsx"
import "./index.css"

const theme = {
  token: {
    colorPrimary: "#c0392b",
    colorInfo: "#c0392b",
    borderRadius: 8,
    fontFamily:
      "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
  },
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfigProvider locale={esES} theme={theme}>
      <AntdApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
)
