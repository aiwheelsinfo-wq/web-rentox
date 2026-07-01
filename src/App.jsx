import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Search from './pages/Search';
import CarResults from './pages/CarResults';
import Invoice from './pages/Invoice';
import BookingStatus from './pages/BookingStatus';
import Profile from './pages/Profile';
import History from './pages/History';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Search />} />
              <Route path="/results" element={<CarResults />} />
              <Route path="/invoice" element={<Invoice />} />
              <Route path="/status/:id" element={<BookingStatus />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </main>
          {/* Simple Premium Footer */}
          <footer className="bg-white border-t border-gray-100 py-6 text-center text-3xs text-gray-400 font-bold uppercase tracking-wider">
            © {new Date().getFullYear()} Agni Car Rental. All rights reserved.
          </footer>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
