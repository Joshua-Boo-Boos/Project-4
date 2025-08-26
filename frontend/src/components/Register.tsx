import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Register.css'
import NavBar from './NavBar';
import SHA512 from 'crypto-js/sha512'

const Register: React.FC = () => {
    const [inputUsername, setInputUsername] = useState<string>('');
    const [inputPassword, setInputPassword] = useState<string>('');
    const {login} = useAuth();

    const submitRegistration = async (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        const passwordSalt = 'ylpjypjlyjplypljrylj5u$^U$^&$^&$£YT£WYTHTEjhjggjnryjrj46iu8579579oYTJRETJRJHET%U£$&ethjetjhtej$^U$^*U$&*%^&£%&£5yTHTH'
        if (inputUsername && inputPassword && inputUsername.indexOf('<script') === -1 && inputPassword.indexOf('<script>') === -1 && inputUsername.indexOf('\'') === -1 && inputPassword.indexOf('\'') === -1) {
            const registerUserAPIURL = 'https://localhost:8000/api/registerUser';
            const response = await fetch(registerUserAPIURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username: inputUsername, password: SHA512(inputPassword + passwordSalt).toString()})
            });
            if (!response.ok) {
                console.error('Error registering user:', response.statusText);
            } else {
                const data = await response.json();
                if (data.success) {
                    try {
                        login(inputUsername);
                    } catch (error) {
                        console.error('Error logging in user after registration:', error);
                    }
                }
            }
            setInputUsername('');
            setInputPassword('');
        }
    }
    return (
        <>
            <NavBar />
            <div className="register-container">
                <h1 className="register-title">Register an account here</h1>
                <form className="register-user-form">
                    <div className="username-elements-container">
                        <label className="username-label">Username:</label>
                        <input onChange={e => setInputUsername(e.target.value)} type="text" className="username-input" />
                    </div>
                    <div className="password-elements-container">
                        <label className="password-label">Password:</label>
                        <input onChange={e => setInputPassword(e.target.value)} type="password" className="password-input" />
                    </div>
                    <button disabled={!inputUsername || !inputPassword} onClick={(e) => submitRegistration(e)} className="submit-registration-details-button">Register</button>
                </form>
            </div>
        </>
    )
}

export default Register