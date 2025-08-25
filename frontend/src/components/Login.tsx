import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'
import NavBar from './NavBar'
import SHA512 from 'crypto-js/sha512'

const Login: React.FC = () => {
    const [inputUsername, setInputUsername] = useState<string>('');
    const [inputPassword, setInputPassword] = useState<string>('');
    const {isLoggedIn, username, login} = useAuth();
    const navigate = useNavigate();

    const attemptLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (inputUsername && inputPassword && inputUsername.indexOf('<script') === -1 && inputPassword.indexOf('<script>') === -1 && inputUsername.indexOf('\'') === -1 && inputPassword.indexOf('\'') === -1) {
            const loginAPIURL = 'https://localhost:8000/api/token';
            const passwordSalt = 'ylpjypjlyjplypljrylj5u$^U$^&$^&$£YT£WYTHTEjhjggjnryjrj46iu8579579oYTJRETJRJHET%U£$&ethjetjhtej$^U$^*U$&*%^&£%&£5yTHTH'
            const response = await fetch(loginAPIURL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({username: inputUsername, password: SHA512(inputPassword + passwordSalt).toString()})
            })
            if (!response.ok) {
                console.error('Error logging in');
            } else {
                const data = await response.json();
                if (data.success) {
                    login(inputUsername);
                    navigate('/');
                }
            }
            setInputUsername(() => '');
            setInputPassword(() => '');
        }
    }
    return (
        <>
            <NavBar />
            <div className="login-container">
                <h1 className="registration-title">Login to your account here</h1>
                <form className="login-form">
                    <div className="login-username-elements">
                        <label className="login-label">Username:</label>
                        <input value={inputUsername} onChange={e => setInputUsername(e.target.value)} type="text" className="username-input" />
                    </div>
                    <div className="login-password-elements">
                        <label className="login-label">Password:</label>
                        <input value={inputPassword} onChange={e => setInputPassword(e.target.value)} type="password" className="password-input" />
                    </div>
                    <button disabled={isLoggedIn || username !== null || !inputUsername || !inputPassword} onClick={(e) => attemptLogin(e)} className="submit-login-form-button">Login</button>
                </form>
            </div>
        </>
    )
}

export default Login