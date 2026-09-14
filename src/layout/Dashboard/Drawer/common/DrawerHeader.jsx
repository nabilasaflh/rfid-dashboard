import { Link } from 'react-router-dom';

// react-bootstrap
import Image from 'react-bootstrap/Image';

// project-import
import { APP_DEFAULT_PATH } from 'config';

// assets
import logo from 'assets/images/logo indocement 2.png';

export const DrawerHeader = () => {
  return (
    <div
      className="m-header"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px 10px 18px'
      }}
    >
      <Link
        to={APP_DEFAULT_PATH}
        className="b-brand text-primary"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textDecoration: 'none'
        }}
      >
        <Image
          src={logo}
          fluid
          className="logo logo-lg"
          alt="logo"
          style={{
            maxWidth: '240px',
            height: 'auto',
            marginTop: '35px'
          }}
        />

        <span
  style={{
    marginTop: '-2px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '500',
    letterSpacing: '0.2px',
    textAlign: 'center',
    whiteSpace: 'nowrap'
  }}
>
  RFID Database Citeureup
</span>
      </Link>
    </div>
  );
};