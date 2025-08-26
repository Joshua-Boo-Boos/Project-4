import { createContext, useContext, useState, useEffect } from 'react';
import { type ReactNode } from 'react'

interface AuthContextType {
    isLoggedIn: boolean
    username: string | null
    login: (username: string) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode}) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await fetch('https://localhost:8000/api/verify-auth', { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    if (data.username) {
                        setIsLoggedIn(true);
                        setUsername(data.username);
                    }
                }
            } catch (error) {
                setIsLoggedIn(false);
                setUsername(null);
            }
        }
        checkAuthStatus();
    }, [])

    const login = (username: string) => {
        setIsLoggedIn(true);
        setUsername(username);
    }

    const logout = () => {
        setIsLoggedIn(false);
        setUsername(null);
    }

    return (
        <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}