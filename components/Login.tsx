import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const Login: React.FC = () => {
    const { login, signup } = useAppContext();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('admin@clinic.com');
    const [password, setPassword] = useState('admin');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isLoginMode) {
                await login(email, password);
            } else {
                // await signup(name, email, password);
                setError("ثبت نام در این نسخه غیرفعال است.")
            }
        } catch (err: any) {
            setError(err.message || 'خطایی رخ داد.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center items-center p-4">
            <div className="bg-[var(--bg-secondary)] p-8 rounded-xl shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold text-center text-[var(--text-primary)] mb-2">
                    {isLoginMode ? 'ورود به سیستم' : 'ایجاد حساب کاربری'}
                </h1>
                <p className="text-center text-[var(--text-secondary)] mb-8">
                    {isLoginMode ? 'برای دسترسی به حساب خود وارد شوید.' : 'اطلاعات خود را برای ثبت نام وارد کنید.'}
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLoginMode && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)]">نام</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="form-input mt-1"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)]">ایمیل</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input mt-1"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-[var(--text-secondary)]">رمز عبور</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input mt-1"
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <button
                        type="submit"
                        className="btn btn-primary w-full py-3 !mt-6"
                        disabled={isLoading}
                    >
                        {isLoading ? 'در حال پردازش...' : (isLoginMode ? 'ورود' : 'ثبت نام')}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button
                        onClick={() => {
                            setIsLoginMode(!isLoginMode);
                            setError('');
                        }}
                        className="text-sm text-[var(--accent-primary)] hover:underline"
                    >
                        {isLoginMode ? 'حساب کاربری ندارید؟ ثبت نام کنید' : 'قبلا ثبت نام کرده‌اید؟ وارد شوید'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;