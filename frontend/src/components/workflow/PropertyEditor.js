// File: frontend/src/components/workflow/PropertyEditor.js
import React, { useState, useEffect } from 'react';

function PropertyEditor({ selectedNode, onUpdateNode }) {
    const [localProperties, setLocalProperties] = useState({});

    useEffect(() => {
        if (selectedNode) setLocalProperties(selectedNode.data || {});
        else setLocalProperties({});
    }, [selectedNode]);

    const handlePropertyChange = (key, value) => {
        const updated = { ...localProperties, [key]: value };
        setLocalProperties(updated);
        if (selectedNode?.id && onUpdateNode) onUpdateNode(selectedNode.id, updated);
    };

    if (!selectedNode) {
        return <div className="p-4 text-gray-500">노드를 선택해주세요.</div>;
    }

    return (
        <div className="p-4 h-full overflow-y-auto">
            <h3 className="text-lg font-semibold text-[#3a2e5a] mb-4">노드 속성</h3>
            <div className="space-y-6">
                {/* 공통: 레이블 */}
                <div>
                    <label className="block text-sm font-medium text-[#7e57c2] mb-1">레이블</label>
                    <input
                        type="text"
                        value={localProperties.label || ''}
                        onChange={e => handlePropertyChange('label', e.target.value)}
                        className="w-full px-3 py-2 border border-[#b39ddb] rounded-md focus:ring-2 focus:ring-[#7e57c2] focus:border-[#7e57c2] transition"
                    />
                </div>
                {/* 타입별 속성 */}
                {selectedNode.data.type === 'Input' && (
                    <>
                        <hr className="my-2" />
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">센서 타입</label>
                            <select
                                value={localProperties.sensorType || 'temperature'}
                                onChange={e => handlePropertyChange('sensorType', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md"
                            >
                                <option value="temperature">온도</option>
                                <option value="humidity">습도</option>
                                <option value="pressure">압력</option>
                                <option value="light">조도</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">단위</label>
                            <input
                                type="text"
                                value={localProperties.unit || ''}
                                onChange={e => handlePropertyChange('unit', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md"
                                placeholder="예: °C, %, hPa"
                            />
                        </div>
                    </>
                )}
                {selectedNode.data.type === 'Process' && (
                    <>
                        <hr className="my-2" />
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">처리 로직</label>
                            <select
                                value={localProperties.logicType || 'filter'}
                                onChange={e => handlePropertyChange('logicType', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md"
                            >
                                <option value="filter">데이터 필터링</option>
                                <option value="transform">데이터 변환</option>
                                <option value="aggregate">데이터 집계</option>
                                <option value="calibrate">데이터 보정</option>
                                <option value="analyze">데이터 분석</option>
                                <option value="monitor">임계값 모니터링</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">파라미터</label>
                            <input
                                type="text"
                                value={localProperties.param || ''}
                                onChange={e => handlePropertyChange('param', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md"
                                placeholder="예: 10, 0.5 등"
                            />
                        </div>
                    </>
                )}
                {selectedNode.data.type === 'Output' && (
                    <>
                        <hr className="my-2" />
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">출력 타입</label>
                            <select
                                value={localProperties.outputType || 'log'}
                                onChange={e => handlePropertyChange('outputType', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md"
                            >
                                <option value="log">콘솔에 로그 기록</option>
                                <option value="notification">알림 보내기</option>
                                <option value="cloudStorage">클라우드 저장</option>
                                <option value="apiCall">외부 API 호출</option>
                                <option value="database">DB에 저장</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">대상</label>
                            <input
                                type="text"
                                value={localProperties.target || ''}
                                onChange={e => handlePropertyChange('target', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md"
                                placeholder="예: admin, cloud 등"
                            />
                        </div>
                    </>
                )}
                {selectedNode.data.type === 'Condition' && (
                    <>
                        <hr className="my-2" />
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">조건 필드</label>
                            <input
                                type="text"
                                value={localProperties.conditionField || ''}
                                onChange={e => handlePropertyChange('conditionField', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md"
                                placeholder="예: temperature"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">연산자</label>
                            <select
                                value={localProperties.operator || '>'}
                                onChange={e => handlePropertyChange('operator', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md"
                            >
                                <option value=">">보다 큼 (&gt;)</option>
                                <option value="<">보다 작음 (&lt;)</option>
                                <option value="===">같음 (===)</option>
                                <option value="!==">같지 않음 (!==)</option>
                                <option value=">=">크거나 같음 (&gt;=)</option>
                                <option value="<=">작거나 같음 (&lt;=)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#7e57c2] mb-1">비교값</label>
                            <input
                                type="text"
                                value={localProperties.compareValue || ''}
                                onChange={e => handlePropertyChange('compareValue', e.target.value)}
                                className="w-full px-3 py-2 border border-[#b39ddb] rounded-md"
                                placeholder="예: 30"
                            />
                        </div>
                    </>
                )}
                <div>
                    <label className="block text-sm font-medium text-[#7e57c2] mb-1">세부사항</label>
                    <textarea
                        value={localProperties.description || ''}
                        onChange={e => handlePropertyChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-[#b39ddb] rounded-md focus:ring-2 focus:ring-[#7e57c2] focus:border-[#7e57c2] transition"
                        placeholder="이 노드에 대한 세부사항을 입력하세요"
                        rows={3}
                    />
                </div>
            </div>
        </div>
    );
}

export default PropertyEditor;