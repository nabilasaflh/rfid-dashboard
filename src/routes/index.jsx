import { createBrowserRouter } from 'react-router-dom';
import NavigationRoutes from './NavigationRoutes';
import PagesRoutes from './PagesRoutes';

const router = createBrowserRouter(
  [NavigationRoutes, PagesRoutes],
  { basename: import.meta.env.VITE_APP_BASE_NAME }
);

export default router;