import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './components/Home.tsx'
import UserProfile from './components/UserProfile.tsx'
import Login from './components/Login.tsx'
import Register from './components/Register.tsx'
import Recipe from './components/Recipe'
import { AuthProvider } from './contexts/AuthContext.tsx'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/user_profile/:urlProvidedUsername' element={<UserProfile />} />
          <Route path='/recipe/:recipeId' element={<Recipe />} />
          <Route path='*' element={<div>404 Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
