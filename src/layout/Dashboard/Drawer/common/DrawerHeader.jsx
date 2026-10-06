import { Link } from 'react-router-dom';

// project-import
import { APP_DEFAULT_PATH } from 'config';

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
          justifyContent: 'center',
          textDecoration: 'none',
          width: '100%',
          marginTop: '35px'
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: '26px',
            fontWeight: '700',
            letterSpacing: '0.2px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            lineHeight: '1.2',
            marginTop: '12px'
          }}
        >
          Logistic Division
          <br />
          Indocement
        </span>

        <span
          style={{
            marginTop: '7px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '400',
            letterSpacing: '0.2px',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          RFID Administration System
        </span>
      </Link>
    </div>
  );
};