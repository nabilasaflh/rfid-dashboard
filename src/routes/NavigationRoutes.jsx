import { lazy } from 'react';

// project-imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

// render - dashboard pages
const DefaultPages = Loadable(lazy(() => import('views/navigation/dashboard/Default')));

const RFIDTagRequest = lazy(
  () => import('views/navigation/rfid-tag-request/RFIDTagRequest')
);

const ChangePasswordPage = Loadable(
  lazy(() => import('views/auth/change-password'))
);

const RFIDStickerRequest = lazy(() => import('views/navigation/rfid-sticker-request/RFIDStickerRequest'));
const History = lazy(() => import('views/navigation/history/History'));
const StokXerafy = lazy(() => import('views/navigation/stok-xerafy/StokXerafy'));
const StokSticker = lazy(() => import('views/navigation/stok-sticker/StokSticker'));
const ScanXerafy = lazy(() => import('views/navigation/scan-xerafy/ScanXerafy'));
const ScanSticker = lazy(() => import('views/navigation/scan-sticker/ScanSticker'));

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
        },
        {
          path: 'change-password',
          element: <ChangePasswordPage />
        },
        {
          path: 'rfid-sticker-request',
          element: <RFIDStickerRequest />
        },
        {
          path: 'history',
          element: <History />
        },
        {
          path: 'stok-xerafy',
          element: <StokXerafy />
        },
        {
          path: 'stok-sticker',
          element: <StokSticker />
        },
        {
          path: 'scan-xerafy',
          element: <ScanXerafy />
        },
        {
          path: 'scan-sticker',
          element: <ScanSticker />
        }
      ]
    }
  ]
};

export default NavigationRoutes;