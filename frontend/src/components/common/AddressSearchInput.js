import React, { useEffect } from 'react';

const AddressSearchInput = ({ value, onAddressSelect }) => {
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
                onAddressSelect(address);
            }
        }).open();
    };

    return (
        <div className="flex gap-2 items-center">
            <input
                type="text"
                value={value}
                readOnly
                placeholder="주소를 검색하세요"
                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb] placeholder-[#b39ddb] focus:ring-2 focus:ring-[#7e57c2] focus:border-[#7e57c2] transition"
                onClick={handleAddressSearch}
            />
            <button
                type="button"
                onClick={handleAddressSearch}
                className="px-4 py-2 text-base bg-[#7e57c2] dark:bg-[#9575cd] text-white rounded-md hover:bg-[#5e35b1] dark:hover:bg-[#b39ddb] transition-colors duration-200 whitespace-nowrap"
            >
                주소 검색
            </button>
        </div>
    );
};

export default AddressSearchInput; 