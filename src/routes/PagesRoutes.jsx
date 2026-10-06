import { lazy } from 'react';

// project-imports
import Loadable from 'components/Loadable';
import AuthLayout from 'layout/Auth';

// render - login pages
const LoginPage = Loadable(lazy(() => import('views/auth/login/Login')));

// render - register pages
const RegisterPage = Loadable(lazy(() => import('views/auth/register/Register')));

const ChangePasswordPage = Loadable(
  lazy(() => import('views/auth/change-password'))
);

// ==============================|| AUTH PAGES ROUTING ||============================== //

const PagesRoutes = {
  path: '/',
  children: [
    {
      path: '/',
      element: <AuthLayout />,
      children: [
        {
          path: 'login',
          element: <LoginPage />
        },
        {
          path: 'register',
          element: <RegisterPage />
        },
        {
          path: 'change-password',
          element: <ChangePasswordPage />
        }
      ]
    }
  ]
};

export default PagesRoutes;
