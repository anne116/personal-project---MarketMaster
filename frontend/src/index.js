import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';
import Search from './pages/Search';
import Map from './pages/Map';
import Account from './pages/Account';
import Analysis from './pages/Analysis';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/search" element={<Search />} />
        <Route path="/map" element={<Map />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
