import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        const apiEndpoint = 'https://api.record360.com/api/users/authenticate';

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    Accept: 'application/json; version=1',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user: { username, password } }),
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.auth_token) {
                // Store the API token in localStorage
                localStorage.setItem('apiToken', data.auth_token);
                onLogin(data.auth_token); // Notify the parent component
            } else {
                setErrorMessage('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('An error occurred during the login request:', error);
            setErrorMessage('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form id="loginForm" onSubmit={handleLogin}>
                <div className="input-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;