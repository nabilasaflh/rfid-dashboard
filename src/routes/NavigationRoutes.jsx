import { lazy } from 'react';

// project-imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

// render - dashboard pages
const DefaultPages = Loadable(lazy(() => import('views/navigation/dashboard/Default')));

const RFIDTagRequest = Loadable(
  lazy(() => import('views/navigation/rfid-tag-request'))
);

// ==============================|| NAVIGATION ROUTING ||============================== //

const NavigationRoutes = {
  path: '/',
  children: [
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        {
          path: '/',
          element: <DefaultPages />
        },
{
  path: 'rfid-tag-request',
  element: <RFIDTagRequest />
}
      ]
    }
  ]
};

export default NavigationRoutes;
