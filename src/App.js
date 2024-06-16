import React from 'react';
import { Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <h1>Welcome to My Personal Project!</h1>
      <nav>
        <ul>
          <li>
            <Link to="/search">Search</Link>
          </li>
          <li>
            <Link to="/map">Map</Link>
          </li>
          <li>
            {/* <Link to="/analysis">Analysis</Link> */}
          </li>
          <li>
            <Link to="/account">Account</Link>
          </li>
        </ul>
      </nav>
      
    </div>
  );
}

export default App;
