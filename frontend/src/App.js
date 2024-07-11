import React from 'react';
import Header from './components/Header';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Search from './pages/Search';
import Analysis from './pages/Analysis';
import Home from './pages/Home';
import Account from './pages/Account';
import SavedList from './pages/SavedList';
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfServices from './pages/TermsOfServices';
import Contact from './pages/Contact';
import Footer from './components/Footer';

const App = () => {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/search' element={<Search />} /> 
        <Route path='/analysis' element={<Analysis />} />
        <Route path='/account' element={<Account />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/saved' element={<SavedList />} />
        <Route path='/privacy' element={<PrivacyPolicy />} />
        <Route path='/terms' element={<TermsOfServices />} />
        <Route path='/contact' element={<Contact />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
};
export default App;
