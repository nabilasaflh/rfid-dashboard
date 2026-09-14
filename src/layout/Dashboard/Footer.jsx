// react-bootstrap
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';

// ==============================|| MAIN LAYOUT - FOOTER ||============================== //

export default function Footer() {
  return (
    <footer className="pc-footer">
      <div className="footer-wrapper container-fluid">
        <Row className="justify-content-end">
          <Col xs="auto" className="my-1">
            <Nav.Link
              className="p-0"
              as="a"
              href="/"
            >
              Home
            </Nav.Link>
          </Col>
        </Row>
      </div>
    </footer>
  );
}