import React from 'react';
import Header from './components/Header';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Search from './pages/Search';
import Analysis from './pages/Analysis';
import Home from './pages/Home';
import Account from './pages/Account';
import SavedList from './pages/SavedList';
import Profile from './pages/Profile';


function App() {
 return (
  <BrowserRouter>
    
    <Header />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/analysis" element={<Analysis />} />
      <Route path="/account" element={<Account />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/saved" element={<SavedList />} />
    </Routes>

  </BrowserRouter>
  );
}
export default App;
