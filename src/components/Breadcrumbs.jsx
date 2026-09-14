import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// react-bootstrap
import Breadcrumb from 'react-bootstrap/Breadcrumb';

// project-imports
import { APP_DEFAULT_PATH } from 'config';
import navigation from 'menu-items';

// ==============================|| MAIN BREADCRUMB ||============================== //

export default function Breadcrumbs() {
  const location = useLocation();

  const [main, setMain] = useState({});
  const [item, setItem] = useState({});

  const getCollapse = useCallback(
    (menuItem) => {
      if (menuItem.children) {
        menuItem.children.forEach((collapse) => {
          if (collapse.type === 'collapse') {
            getCollapse(collapse);
          } else if (collapse.type === 'item' && location.pathname === collapse.url) {
            setMain({
              type: 'collapse',
              title: typeof menuItem.title === 'string' ? menuItem.title : undefined
            });

            setItem({
              type: 'item',
              title: typeof collapse.title === 'string' ? collapse.title : undefined,
              breadcrumbs: collapse.breadcrumbs !== false
            });
          }
        });
      }
    },
    [location.pathname]
  );

  useEffect(() => {
    setMain({});
    setItem({});

    navigation.items.forEach((navItem) => {
      if (navItem.type === 'group') {
        getCollapse(navItem);
      }
    });
  }, [location.pathname, getCollapse]);

  const title = item.title ?? '';

  if (!title || item.breadcrumbs === false) {
    return null;
  }

  return (
    <div
      className="page-header"
      style={{
        padding: '0 0 16px 0',
        margin: 0
      }}
    >
      <div className="page-block">
        <div>
          <h5
            className="mb-2"
            style={{
              fontSize: '24px',
              fontWeight: '500'
            }}
          >
            {title}
          </h5>

          <Breadcrumb
            style={{
              margin: 0,
              fontSize: '14px'
            }}
          >
            {location.pathname !== APP_DEFAULT_PATH && location.pathname !== '/' && (
              <Breadcrumb.Item href={APP_DEFAULT_PATH}>
                Home
              </Breadcrumb.Item>
            )}

            <Breadcrumb.Item active className="text-capitalize">
              {title}
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </div>
    </div>
  );
}