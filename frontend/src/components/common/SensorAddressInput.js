import React, { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';

const SensorAddressInput = ({ value, onAddressSelect, placeholder = "센서 위치를 입력하거나 검색하세요" }) => {
    const [inputValue, setInputValue] = useState(value || '');

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        // 카카오 주소찾기 스크립트가 로드되어 있는지 확인
        if (!window.daum || !window.daum.Postcode) {
            console.error('카카오 주소찾기 스크립트가 로드되지 않았습니다.');
            return;
        }
    }, []);

    const handleAddressSearch = () => {
        if (!window.daum || !window.daum.Postcode) {
            alert('카카오 주소찾기 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        new window.daum.Postcode({
            oncomplete: function(data) {
                // 도로명 주소 또는 지번 주소
                const address = data.roadAddress || data.jibunAddress;
                setInputValue(address);
                onAddressSelect(address);
            }
        }).open();
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onAddressSelect(newValue);
    };

    return (
        <div className="flex gap-2 items-center">
            <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                />
            </div>
            <button
                type="button"
                onClick={handleAddressSearch}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 whitespace-nowrap"
                title="카카오 주소찾기"
            >
                <Search size={16} className="mr-1" />
                주소 검색
            </button>
        </div>
    );
};

export default SensorAddressInput; 