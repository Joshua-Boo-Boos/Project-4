import { useNavigate } from 'react-router-dom'
import './NavBar.css'
import { useAuth } from '../contexts/AuthContext'

const NavBar: React.FC = () => {
    const { isLoggedIn, username, logout } = useAuth();

    const navigator = useNavigate();
    const loadPage = (pageToLoad: string) => {
        navigator(pageToLoad);
    }
    const logoutFunction = () => {
        logout();
        loadPage('/');
    }

    return (
        <nav className="nav-bar">
            <ul className="nav-bar-item-list">
                <div className="nav-bar-items-container">
                    <li key='home-li' onClick={() => loadPage('/')} className="nav-bar-list-item">Home</li>
                    <li key='profile-li' onClick={() => (isLoggedIn && username ? loadPage(`/user_profile/${username}`) : loadPage('/login'))} className='nav-bar-list-item'>Profile</li>
                    {(!isLoggedIn || !username) ? (
                            <>
                                <li key='login-li' onClick={() => loadPage('/login')} className="nav-bar-list-item">Login</li>
                                <li key='register-li' onClick={() => loadPage('/register')} className="nav-bar-list-item">Register</li>
                            </>
                        ) : (
                            <li key='logout-li' onClick={() => logoutFunction()} className='nav-bar-list-item'>Logout</li>
                        )
                    }
                </div>
            </ul>
        </nav>
    )
}

export default NavBar