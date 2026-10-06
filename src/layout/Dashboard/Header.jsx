import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// react-bootstrap
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Nav from 'react-bootstrap/Nav';
import Stack from 'react-bootstrap/Stack';

// project-imports
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// =============================|| MAIN LAYOUT - HEADER ||============================== //

export default function Header() {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened;

  const [username] = useState(
    localStorage.getItem('username') || 'User'
  );

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  // =============================|| SEARCH PAGES ||============================== //

  const pages = [
    {
      title: 'Home',
      keywords: 'home',
      path: '/'
    },
    {
      title: 'RFID Tag Request',
      keywords: 'rfid tag request',
      path: '/rfid-tag-request'
    },
    {
      title: 'Change Password',
      keywords: 'change password',
      path: '/change-password'
    }
  ];

  const searchResults = pages.filter((page) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return false;
    }

    return (
      page.title.toLowerCase().includes(search) ||
      page.keywords.toLowerCase().includes(search)
    );
  });

  const handleSearchNavigate = (path) => {
    setSearchTerm('');
    setSearchOpen(false);
    navigate(path);
  };

  return (
    <header className="pc-header">
      <div className="header-wrapper">

        {/* ================= LEFT SIDE ================= */}
        <div className="me-auto pc-mob-drp">
          <Nav className="list-unstyled">

            {/* Sidebar Collapse */}
            <Nav.Item className="pc-h-item pc-sidebar-collapse">
              <Nav.Link
                as={Link}
                to="#"
                className="pc-head-link ms-0"
                id="sidebar-hide"
                onClick={(e) => {
                  e.preventDefault();
                  handlerDrawerOpen(!drawerOpen);
                }}
              >
                <i className="ph ph-list" />
              </Nav.Link>
            </Nav.Item>

            {/* Mobile Sidebar */}
            <Nav.Item className="pc-h-item pc-sidebar-popup">
              <Nav.Link
                as={Link}
                to="#"
                className="pc-head-link ms-0"
                id="mobile-collapse"
                onClick={(e) => {
                  e.preventDefault();
                  handlerDrawerOpen(!drawerOpen);
                }}
              >
                <i className="ph ph-list" />
              </Nav.Link>
            </Nav.Item>

            {/* ================= SEARCH ================= */}
            <Dropdown
              className="pc-h-item dropdown"
              show={searchOpen}
              onToggle={(isOpen) => {
                setSearchOpen(isOpen);

                if (!isOpen) {
                  setSearchTerm('');
                }
              }}
            >
              <Dropdown.Toggle
                variant="link"
                className="pc-head-link arrow-none m-0"
                id="dropdown-search"
              >
                <i className="ph ph-magnifying-glass" />
              </Dropdown.Toggle>

              <Dropdown.Menu
                className="pc-h-dropdown"
                style={{
                  width: '280px',
                  padding: '8px'
                }}
              >
                {/* Search Input */}
                <Form
                  className="px-2 py-1"
                  onSubmit={(e) => {
                    e.preventDefault();

                    if (searchResults.length > 0) {
                      handleSearchNavigate(searchResults[0].path);
                    }
                  }}
                >
                  <Form.Control
                    type="search"
                    placeholder="Search page..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="shadow-none"
                    style={{
                      fontSize: '14px'
                    }}
                  />
                </Form>

                {/* Search Results */}
                {searchTerm.trim() !== '' && (
                  <div style={{ marginTop: '5px' }}>

                    {searchResults.length > 0 ? (
                      searchResults.map((page) => (
                        <Dropdown.Item
                          key={page.path}
                          onClick={() =>
                            handleSearchNavigate(page.path)
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 10px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          <i
                            className={
                              page.path === '/'
                                ? 'ph ph-house'
                                : page.path === '/rfid-tag-request'
                                  ? 'ph ph-tag'
                                  : 'ph ph-lock-key'
                            }
                            style={{
                              fontSize: '16px',
                              marginRight: '8px'
                            }}
                          />

                          <span>{page.title}</span>
                        </Dropdown.Item>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: '8px 10px',
                          color: '#999999',
                          fontSize: '13px'
                        }}
                      >
                        Page tidak ditemukan
                      </div>
                    )}

                  </div>
                )}
              </Dropdown.Menu>
            </Dropdown>

          </Nav>
        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div className="ms-auto">
          <Nav className="list-unstyled">

            {/* ================= USER PROFILE ================= */}
            <Dropdown
              className="pc-h-item"
              align="end"
            >
              <Dropdown.Toggle
                className="pc-head-link arrow-none me-0"
                variant="link"
                id="user-profile-dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i className="ph ph-user-circle" />
              </Dropdown.Toggle>

              <Dropdown.Menu
                className="dropdown-user-profile pc-h-dropdown p-0 overflow-hidden"
              >

                {/* ================= PROFILE HEADER ================= */}
                <Dropdown.Header
                  style={{
                    backgroundColor: '#234F9A',
                    padding: '14px 18px'
                  }}
                >
                  <Stack
                    direction="horizontal"
                    gap={2}
                    className="my-1"
                  >

                    {/* User Icon */}
                    <div
                      className="flex-shrink-0"
                      style={{
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <i
                        className="ph ph-user-circle"
                        style={{
                          fontSize: '38px',
                          color: '#ffffff'
                        }}
                      />
                    </div>

                    {/* User Information */}
                    <Stack gap={0}>
                      <h6
                        className="text-white mb-0"
                        style={{
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        {username}
                      </h6>

                      <span
                        className="text-white text-opacity-75"
                        style={{
                          fontSize: '12px'
                        }}
                      >
                        RFID Database User
                      </span>
                    </Stack>

                  </Stack>
                </Dropdown.Header>

                {/* ================= PROFILE MENU ================= */}
                <div className="dropdown-body">
                  <div
                    className="profile-notification-scroll position-relative"
                    style={{
                      maxHeight: 'calc(100vh - 225px)'
                    }}
                  >

                    {/* Settings */}
                    <Dropdown.Item
                      as={Link}
                      to="#"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '8px',
                        padding: '9px 18px',
                        width: '100%'
                      }}
                    >
                      <i
                        className="ph ph-gear"
                        style={{
                          fontSize: '19px',
                          color: '#8c8c8c',
                          flexShrink: 0
                        }}
                      />

                      <span
                        style={{
                          fontSize: '14px',
                          color: '#8c8c8c'
                        }}
                      >
                        Settings
                      </span>
                    </Dropdown.Item>

                    {/* Change Password */}
                    <Dropdown.Item
                      onClick={() => {
                        navigate('/change-password');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '8px',
                        padding: '9px 18px',
                        width: '100%',
                        cursor: 'pointer'
                      }}
                    >
                      <i
                        className="ph ph-lock-key"
                        style={{
                          fontSize: '19px',
                          color: '#8c8c8c',
                          flexShrink: 0
                        }}
                      />

                      <span
                        style={{
                          fontSize: '14px',
                          color: '#8c8c8c'
                        }}
                      >
                        Change Password
                      </span>
                    </Dropdown.Item>

                    {/* Logout */}
                    <div
                      className="d-grid"
                      style={{
                        margin: '8px 12px'
                      }}
                    >
                      <Button
                        style={{
                          backgroundColor: '#234F9A',
                          borderColor: '#234F9A',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: '500',
                          padding: '7px 10px'
                        }}
                        onClick={() => {
                          localStorage.removeItem('username');
                          navigate('/login');
                        }}
                      >
                        <i className="ph ph-sign-out align-middle me-2" />
                        Logout
                      </Button>
                    </div>

                  </div>
                </div>

              </Dropdown.Menu>
            </Dropdown>

          </Nav>
        </div>

      </div>
    </header>
  );
}