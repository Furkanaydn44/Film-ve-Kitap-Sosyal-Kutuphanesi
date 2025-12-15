import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import MainPage from "./pages/MainPage";
import HomePage from "./pages/HomePage";
import MovieDetail from './pages/MovieDetail';
import BookDetail from "./pages/BookDetail";
import ListDetail from "./pages/ListDetail"; // 🔥 YENİ EKLENDİ
import ProtectedRoute from "./components/protectedRoute";
import BookDiscover from "./pages/BookDiscover";
import { useAuth } from "./context/AuthContext";
import ResetPassword from "./pages/ResetPassword";
import UserConnections from "./pages/UserConnections";

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/main" /> : <Login />} 
      />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/main" /> : <Login />} 
      />
      <Route path="/reset-password" element={<ResetPassword />} />

    
      
      {/* Protected Routes - MainPage Layout */}
      <Route
        path="/main"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainPage />
          </ProtectedRoute>
        }
      >
        {/* Nested routes - MainPage içinde render olur */}
        <Route index element={<HomePage />} />
        <Route path="discover" element={<Discover />} />
        <Route path="bookdiscover" element={<BookDiscover />} />
        
        {/* Profil Rotaları */}
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:username" element={<Profile />} />

        {/* Detay Rotaları */}
        <Route path="detail/:id" element={<MovieDetail />} />
        <Route path="book/:id" element={<BookDetail />} />
        <Route path="bookdetail/:id" element={<BookDetail />} />
        <Route path="moviedetail/:id" element={<MovieDetail />} />

        {/* 🔥 YENİ LİSTE DETAY ROTASI */}
        <Route path="list/:listId" element={<ListDetail />} />
        <Route path="connections/:type" element={<UserConnections />} />
        <Route path="profile/:username/connections/:type" element={<UserConnections />} />
      </Route>
    </Routes>
    
  );
};

export default App;