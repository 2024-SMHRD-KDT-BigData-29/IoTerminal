// File: frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { register, login } from '../services/authService';
import AddressSearchInput from '../components/common/AddressSearchInput';

// DatePicker 커스텀 스타일
const customDatePickerStyles = {
    calendar: {
        backgroundColor: '#3a2e5a',
        border: '1px solid #9575cd',
        borderRadius: '1rem',
        fontFamily: 'inherit',
    },
    header: {
        backgroundColor: '#7e57c2',
        color: '#fff',
        borderTopLeftRadius: '1rem',
        borderTopRightRadius: '1rem',
    },
    day: {
        color: '#b39ddb',
        '&:hover': {
            backgroundColor: '#9575cd',
            color: '#fff',
        },
    },
    selectedDay: {
        backgroundColor: '#7e57c2',
        color: '#fff',
    },
    today: {
        color: '#7e57c2',
        fontWeight: 'bold',
    },
    monthDropdown: {
        backgroundColor: '#3a2e5a',
        color: '#b39ddb',
    },
    yearDropdown: {
        backgroundColor: '#3a2e5a',
        color: '#b39ddb',
    },
};

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        userId: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: '',
        gender: '',
        name: '',
        birthdate: null,
        address: '',
        addressDetail: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [passwordMatchError, setPasswordMatchError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if ((name === 'password' || name === 'confirmPassword')) {
            if (name === 'password') {
                if (value !== formData.confirmPassword) {
                    setPasswordMatchError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
                } else {
                    setPasswordMatchError('');
                }
            } else if (name === 'confirmPassword') {
                if (formData.password !== value) {
                    setPasswordMatchError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
                } else {
                    setPasswordMatchError('');
                }
            }
        }
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({
            ...prev,
            birthdate: date
        }));
    };

    const handleAddressSelect = (address) => {
        setFormData(prev => ({
            ...prev,
            address: address
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            await register({
                ...formData,
                address: `${formData.address} ${formData.addressDetail}`.trim()
            });
            // 회원가입 성공 후 로그인 페이지로 이동
            alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
            navigate('/login');
        } catch (err) {
            setError(err.message || '회원가입에 실패했습니다.');
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
                        이미 계정이 있으신가요?{' '}
                        <Link to="/login" className="font-medium text-[#7e57c2] dark:text-[#9575cd] hover:text-[#5e35b1] dark:hover:text-[#b39ddb]">
                            로그인하기
                        </Link>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}
                    {passwordMatchError && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
                            {passwordMatchError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="userId" className="block text-sm font-medium text-[#3a2e5a] dark:text-[#b39ddb]">
                                아이디
                            </label>
                            <input
                                id="userId"
                                name="userId"
                                type="text"
                                required
                                value={formData.userId}
                                onChange={handleChange}
                                className="mt-1 block w-full px-4 py-3 rounded-xl border border-[#d1c4e9] dark:border-[#9575cd] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#9575cd] dark:placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] focus:border-transparent transition-colors duration-200"
                                placeholder="아이디를 입력하세요"
                                autoComplete="off"
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
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 rounded-xl border border-[#d1c4e9] dark:border-[#9575cd] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#9575cd] dark:placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] focus:border-transparent transition-colors duration-200"
                                    placeholder="비밀번호를 입력하세요"
                                    autoComplete="new-password"
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

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#3a2e5a] dark:text-[#b39ddb]">
                                비밀번호 확인
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 rounded-xl border border-[#d1c4e9] dark:border-[#9575cd] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#9575cd] dark:placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] focus:border-transparent transition-colors duration-200"
                                    placeholder="비밀번호를 다시 입력하세요"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9575cd] dark:text-[#b39ddb] hover:text-[#7e57c2] dark:hover:text-[#ede7f6]"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#3a2e5a] dark:text-[#b39ddb]">
                                이메일
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full px-4 py-3 rounded-xl border border-[#d1c4e9] dark:border-[#9575cd] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#9575cd] dark:placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] focus:border-transparent transition-colors duration-200"
                                placeholder="이메일을 입력하세요"
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-[#3a2e5a] dark:text-[#b39ddb]">
                                휴대폰 번호
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                className="mt-1 block w-full px-4 py-3 rounded-xl border border-[#d1c4e9] dark:border-[#9575cd] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#9575cd] dark:placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] focus:border-transparent transition-colors duration-200"
                                placeholder="휴대폰 번호를 입력하세요"
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#3a2e5a] dark:text-[#b39ddb] mb-2">
                                성별
                            </label>
                            <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="male"
                                        checked={formData.gender === 'male'}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-[#7e57c2] dark:text-[#b39ddb] focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] border-[#d1c4e9] dark:border-[#9575cd]"
                                    />
                                    <span className="ml-2 text-[#3a2e5a] dark:text-[#b39ddb]">남성</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="female"
                                        checked={formData.gender === 'female'}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-[#7e57c2] dark:text-[#b39ddb] focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] border-[#d1c4e9] dark:border-[#9575cd]"
                                    />
                                    <span className="ml-2 text-[#3a2e5a] dark:text-[#b39ddb]">여성</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-[#3a2e5a] dark:text-[#b39ddb]">
                                이름
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-4 py-3 rounded-xl border border-[#d1c4e9] dark:border-[#9575cd] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#9575cd] dark:placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] focus:border-transparent transition-colors duration-200"
                                placeholder="이름을 입력하세요"
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label htmlFor="birthdate" className="block text-sm font-medium text-[#3a2e5a] dark:text-[#b39ddb]">
                                생년월일
                            </label>
                            <DatePicker
                                selected={formData.birthdate}
                                onChange={handleDateChange}
                                dateFormat="yyyy/MM/dd"
                                className="mt-1 block w-full px-4 py-3 rounded-xl border border-[#d1c4e9] dark:border-[#9575cd] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#9575cd] dark:placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] focus:border-transparent transition-colors duration-200"
                                placeholderText="생년월일을 선택하세요"
                                maxDate={new Date()}
                                showYearDropdown
                                showMonthDropdown
                                dropdownMode="select"
                                calendarClassName="custom-datepicker"
                                popperClassName="custom-datepicker-popper"
                                popperPlacement="bottom-start"
                            />
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-[#3a2e5a] dark:text-[#b39ddb]">
                                주소
                            </label>
                            <div className="mt-1">
                                <AddressSearchInput
                                    value={formData.address}
                                    onAddressSelect={handleAddressSelect}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="addressDetail" className="block text-sm font-medium text-[#3a2e5a] dark:text-[#b39ddb]">
                                상세주소
                            </label>
                            <input
                                id="addressDetail"
                                name="addressDetail"
                                type="text"
                                value={formData.addressDetail}
                                onChange={handleChange}
                                className="mt-1 block w-full px-4 py-3 rounded-xl border border-[#d1c4e9] dark:border-[#9575cd] bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#9575cd] dark:placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] focus:border-transparent transition-colors duration-200"
                                placeholder="상세주소를 입력하세요"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#7e57c2] dark:bg-[#9575cd] hover:bg-[#5e35b1] dark:hover:bg-[#b39ddb] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7e57c2] dark:focus:ring-[#9575cd] transition-colors duration-200"
                    >
                        IoTerminal 회원가입
                    </button>
                </form>
            </div>
        </div>
    );
};

// 전역 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .custom-datepicker {
        background-color: #3a2e5a !important;
        border: 1px solid #9575cd !important;
        border-radius: 1rem !important;
        font-family: inherit !important;
    }

    .custom-datepicker .react-datepicker__header {
        background-color: #7e57c2 !important;
        border-bottom: 1px solid #9575cd !important;
        border-top-left-radius: 1rem !important;
        border-top-right-radius: 1rem !important;
    }

    .custom-datepicker .react-datepicker__current-month,
    .custom-datepicker .react-datepicker__day-name {
        color: #fff !important;
    }

    .custom-datepicker .react-datepicker__day {
        color: #b39ddb !important;
        border-radius: 0.5rem !important;
    }

    .custom-datepicker .react-datepicker__day:hover {
        background-color: #9575cd !important;
        color: #fff !important;
    }

    .custom-datepicker .react-datepicker__day--selected {
        background-color: #7e57c2 !important;
        color: #fff !important;
    }

    .custom-datepicker .react-datepicker__day--today {
        color: #7e57c2 !important;
        font-weight: bold !important;
    }

    .custom-datepicker .react-datepicker__month-select,
    .custom-datepicker .react-datepicker__year-select {
        background-color: #3a2e5a !important;
        color: #b39ddb !important;
        border: 1px solid #9575cd !important;
        border-radius: 0.5rem !important;
        padding: 0.25rem !important;
    }

    .custom-datepicker .react-datepicker__month-select option,
    .custom-datepicker .react-datepicker__year-select option {
        background-color: #3a2e5a !important;
        color: #b39ddb !important;
    }

    .custom-datepicker-popper {
        z-index: 9999 !important;
    }
`;
document.head.appendChild(style);

export default RegisterPage;