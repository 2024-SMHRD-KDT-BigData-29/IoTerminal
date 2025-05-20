// File: frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../services/authService';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f6fc] dark:bg-[#2a2139] p-4">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#3a2e5a] p-8 rounded-2xl shadow-xl">
                <div className="text-center">
                    <Link to="/" className="inline-block">
                        <span className="text-3xl font-extrabold text-[#7e57c2] dark:text-[#b39ddb] tracking-tight select-none">IoTerminal</span>
                    </Link>
                    <p className="mt-2 text-sm text-[#9575cd] dark:text-[#b39ddb]">
                        또는{' '}
                        <Link to="/register" className="font-medium text-[#7e57c2] dark:text-[#9575cd] hover:text-[#5e35b1] dark:hover:text-[#b39ddb]">
                            새 계정 만들기
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#3a2e5a] dark:text-[#b39ddb]">
                                이메일
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 rounded-xl border border-[#d1c4e9] dark:border-[#9575cd] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#9575cd] dark:placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] focus:border-transparent transition-colors duration-200"
                                placeholder="이메일을 입력하세요"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[#3a2e5a] dark:text-[#b39ddb]">
                                비밀번호
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-4 py-3 rounded-xl border border-[#d1c4e9] dark:border-[#9575cd] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#9575cd] dark:placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] focus:border-transparent transition-colors duration-200"
                                    placeholder="비밀번호를 입력하세요"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9575cd] dark:text-[#b39ddb] hover:text-[#7e57c2] dark:hover:text-[#ede7f6]"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-[#d1c4e9] dark:border-[#9575cd] text-[#7e57c2] dark:text-[#b39ddb] focus:ring-[#7e57c2] dark:focus:ring-[#9575cd]"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-[#3a2e5a] dark:text-[#b39ddb]">
                                로그인 상태 유지
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link to="/forgot-password" className="font-medium text-[#7e57c2] dark:text-[#9575cd] hover:text-[#5e35b1] dark:hover:text-[#b39ddb]">
                                비밀번호를 잊으셨나요?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#7e57c2] dark:bg-[#9575cd] hover:bg-[#5e35b1] dark:hover:bg-[#b39ddb] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] transition-colors duration-200"
                    >
                        IoTerminal 로그인
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;