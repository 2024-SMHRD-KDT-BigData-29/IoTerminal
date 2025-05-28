import React, { useState } from 'react';

const TestInputPage = () => {
    const [testName, setTestName] = useState('테스트 워크플로우');

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">입력 필드 테스트</h1>
            
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">기본 입력 필드:</label>
                <input
                    type="text"
                    value={testName}
                    onChange={(e) => {
                        console.log('기본 입력 변경:', e.target.value);
                        setTestName(e.target.value);
                    }}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                    placeholder="기본 입력 필드"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">워크플로우 스타일 입력 필드:</label>
                <input
                    type="text"
                    value={testName}
                    onChange={(e) => {
                        console.log('워크플로우 스타일 입력 변경:', e.target.value);
                        setTestName(e.target.value);
                    }}
                    className="text-xl font-semibold bg-white dark:bg-gray-800 border border-[#d1c4e9] dark:border-[#9575cd] focus:border-[#7e57c2] dark:focus:border-[#b39ddb] focus:outline-none px-3 py-2 text-[#3a2e5a] dark:text-[#b39ddb] rounded-md min-w-[300px]"
                    placeholder="워크플로우 이름을 입력하세요"
                />
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-600">현재 값: {testName}</p>
            </div>

            <div className="mb-4">
                <button
                    onClick={() => setTestName('버튼으로 변경된 이름')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    이름 변경 테스트
                </button>
            </div>
        </div>
    );
};

export default TestInputPage; 