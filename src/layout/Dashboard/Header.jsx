import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// react-bootstrap
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Nav from 'react-bootstrap/Nav';
import Stack from 'react-bootstrap/Stack';

// project-imports
import MainCard from 'components/MainCard';
import SimpleBarScroll from 'components/third-party/SimpleBar';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// assets

// =============================|| MAIN LAYOUT - HEADER ||============================== //

export default function Header() {
  const { menuMaster } = useGetMenuMaster();
const drawerOpen = menuMaster?.isDashboardDrawerOpened;

const [username] = useState(localStorage.getItem('username') || 'User');
const navigate = useNavigate();

  return (
    <header className="pc-header">
      <div className="header-wrapper">
        <div className="me-auto pc-mob-drp">
          <Nav className="list-unstyled">
            <Nav.Item className="pc-h-item pc-sidebar-collapse">
              <Nav.Link
                as={Link}
                to="#"
                className="pc-head-link ms-0"
                id="sidebar-hide"
                onClick={() => {
                  handlerDrawerOpen(!drawerOpen);
                }}
              >
                <i className="ph ph-list" />
              </Nav.Link>
            </Nav.Item>

            <Nav.Item className="pc-h-item pc-sidebar-popup">
              <Nav.Link
                as={Link}
                to="#"
                className="pc-head-link ms-0"
                id="mobile-collapse"
                onClick={() => handlerDrawerOpen(!drawerOpen)}
              >
                <i className="ph ph-list" />
              </Nav.Link>
            </Nav.Item>

            <Dropdown className="pc-h-item dropdown">
              <Dropdown.Toggle
                variant="link"
                className="pc-head-link arrow-none m-0 trig-drp-search"
                id="dropdown-search"
              >
                <i className="ph ph-magnifying-glass" />
              </Dropdown.Toggle>

              <Dropdown.Menu className="pc-h-dropdown drp-search">
                <Form className="px-3 py-2">
                  <Form.Control
                    type="search"
                    placeholder="Search here. . ."
                    className="border-0 shadow-none"
                  />
                </Form>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </div>

        <div className="ms-auto">
          <Nav className="list-unstyled">

            
            {/* ================= USER PROFILE ================= */}
            <Dropdown className="pc-h-item" align="end">
              <Dropdown.Toggle
                className="pc-head-link arrow-none me-0"
                variant="link"
                id="user-profile-dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i className="ph ph-user-circle" />
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-user-profile pc-h-dropdown p-0 overflow-hidden">

                {/* Profile Header */}
                <Dropdown.Header
                  style={{
                    backgroundColor: '#234F9A'
                  }}
                >
                  <Stack
                    direction="horizontal"
                    gap={3}
                    className="my-2"
                  >
                    <div
                    className="flex-shrink-0"
                    style={{
                      width: '45px',
                      height: '45px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                      }}
                      >
                        <i
                        className="ph ph-user-circle"
                        style={{
                          fontSize: '45px',
                          color: '#ffffff'
                        }}
                        />
                        </div>

                    <Stack gap={1}>
                      <h6 className="text-white mb-0">
                        {username}
                      </h6>

                      <span className="text-white text-opacity-75">
                        RFID Database User
                      </span>
                    </Stack>
                  </Stack>
                </Dropdown.Header>

                {/* Profile Menu */}
                <div className="dropdown-body">
                  <div
                    className="profile-notification-scroll position-relative"
                    style={{ maxHeight: 'calc(100vh - 225px)' }}
                  >
                    <Dropdown.Item
                      as={Link}
                      to="#"
                      className="justify-content-start"
                    >
                      <i className="ph ph-gear me-2" />
                      Settings
                    </Dropdown.Item>

                    <Dropdown.Item
                      as={Link}
                      to="#"
                      className="justify-content-start"
                    >
                      <i className="ph ph-lock-key me-2" />
                      Change Password
                    </Dropdown.Item>

                    <div className="d-grid my-2">
                      <Button
                      style={{
                        backgroundColor: '#234F9A',
                        borderColor: '#234F9A',
                        color: '#ffffff'
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