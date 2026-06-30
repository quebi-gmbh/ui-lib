import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import "./main.css"
import Layout from "./routes/Layout"
import Home from "./routes/Home"
import ComponentsLayout from "./routes/ComponentsLayout"
import Components from "./routes/Components"
import ComponentDetail from "./routes/ComponentDetail"
import NotFound from "./routes/NotFound"

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      {
        path: "/components",
        element: <ComponentsLayout />,
        children: [
          { index: true, element: <Components /> },
          { path: ":slug", element: <ComponentDetail /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
