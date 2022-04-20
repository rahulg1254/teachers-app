import React from "react";
import "./App.css";
import { extendTheme } from "native-base";
import { DEFAULT_THEME, AppShell } from "@shiksha/common-lib";
import ClassDetails from "./pages/ClassDetails";
import MyClassRoute from "pages/MyClassRoute";
import { navigationRoutes } from "services/routes";

function App() {
  const theme = extendTheme(DEFAULT_THEME);

  const routes = [
    {
      path: "my-classes/:classId",
      component: ClassDetails,
    },
    {
      path: "*",
      component: MyClassRoute,
    },
  ];
  const LoginComponent = React.lazy(() => import("core/Login"));

  return (
    <AppShell
      theme={theme}
      basename={process.env.PUBLIC_URL}
      routes={routes}
      AuthComponent={LoginComponent}
    />
  );
}

export default App;
