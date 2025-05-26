import React, { useState } from 'react';
import { createDevice } from '../../services/deviceService';
import AddressSearchInput from '../common/AddressSearchInput';

export default function DeviceCreateForm({ onSuccess }) {
    const [form, setForm] = useState({ name: '', type: '', location: '', description: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAddressSelect = (address) => {
        setForm({ ...form, location: address });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await createDevice(form);
            if (res.success) {
                alert('디바이스가 등록되었습니다.');
                setForm({ name: '', type: '', location: '', description: '' });
                onSuccess && onSuccess();
            } else {
                alert(res.message || '디바이스 등록 실패');
            }
        } catch (err) {
            alert('디바이스 등록 중 오류');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#3a2e5a] rounded-xl shadow p-6 mb-8 flex flex-col gap-4">
            <input
                name="name"
                placeholder="디바이스명"
                value={form.name}
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#5e35b1] focus:outline-none"
            />
            <input
                name="type"
                placeholder="타입"
                value={form.type}
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#5e35b1] focus:outline-none"
            />
            <AddressSearchInput value={form.location} onAddressSelect={handleAddressSelect} />
            <input
                name="description"
                placeholder="설명"
                value={form.description}
                onChange={handleChange}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#5e35b1] focus:outline-none"
            />
            <button
                type="submit"
                disabled={isLoading}
                className="self-end px-6 py-2 bg-[#7e57c2] dark:bg-[#9575cd] text-white rounded-lg hover:bg-[#5e35b1] dark:hover:bg-[#b39ddb] transition-colors duration-200"
            >
                {isLoading ? '등록 중...' : '디바이스 등록'}
            </button>
        </form>
    );
} 