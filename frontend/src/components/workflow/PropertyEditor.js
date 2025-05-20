// File: frontend/src/components/workflow/PropertyEditor.js
import React, { useState, useEffect, useRef } from 'react';

function PropertyEditor({ selectedNode, onUpdateNode }) {
    const [localProperties, setLocalProperties] = useState({});
    const updateTimeoutRef = useRef(null);

    useEffect(() => {
        if (selectedNode && selectedNode.data) {
            setLocalProperties(selectedNode.data);
        }
    }, [selectedNode?.data?.id]);

    const handlePropertyChange = (key, value) => {
        setLocalProperties(prev => ({
            ...prev,
            [key]: value
        }));

        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
            if (selectedNode?.id && onUpdateNode) {
                onUpdateNode(selectedNode.id, {
                    ...localProperties,
                    [key]: value
                });
            }
        }, 300);
    };

    if (!selectedNode || !selectedNode.data) {
        return (
            <div className="p-4 text-gray-500">
                노드를 선택해주세요.
            </div>
        );
    }

    const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
    const commonInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500";
    const commonSelectClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500";

    return (
        <div className="p-4 h-full overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">노드 속성</h3>
            
            <div className="space-y-4">
                <div>
                    <label className={commonLabelClass}>레이블</label>
                    <input
                        type="text"
                        value={localProperties.label || ''}
                        onChange={(e) => handlePropertyChange('label', e.target.value)}
                        className={commonInputClass}
                    />
                </div>

                {selectedNode.data.type === 'Process' && (
                    <div>
                        <label className={commonLabelClass}>처리 로직</label>
                        <select
                            value={localProperties.logicType || 'filter'}
                            onChange={(e) => handlePropertyChange('logicType', e.target.value)}
                            className={commonSelectClass}
                        >
                            <option value="filter">데이터 필터링</option>
                            <option value="transform">데이터 변환</option>
                            <option value="aggregate">데이터 집계</option>
                            <option value="calibrate">데이터 보정</option>
                            <option value="analyze">데이터 분석</option>
                            <option value="monitor">임계값 모니터링</option>
                        </select>
                    </div>
                )}

                {selectedNode.data.type === 'Output' && (
                    <div>
                        <label className={commonLabelClass}>출력 타입</label>
                        <select
                            value={localProperties.outputType || 'log'}
                            onChange={(e) => handlePropertyChange('outputType', e.target.value)}
                            className={commonSelectClass}
                        >
                            <option value="log">콘솔에 로그 기록</option>
                            <option value="notification">알림 보내기</option>
                            <option value="cloudStorage">클라우드 저장</option>
                            <option value="apiCall">외부 API 호출</option>
                            <option value="database">DB에 저장</option>
                        </select>
                    </div>
                )}

                {selectedNode.data.type === 'Condition' && (
                    <>
                        <div>
                            <label className={commonLabelClass}>조건 필드</label>
                            <input
                                type="text"
                                value={localProperties.conditionField || ''}
                                onChange={(e) => handlePropertyChange('conditionField', e.target.value)}
                                className={commonInputClass}
                                placeholder="예: temperature"
                            />
                        </div>
                        <div>
                            <label className={commonLabelClass}>연산자</label>
                            <select
                                value={localProperties.operator || '>'}
                                onChange={(e) => handlePropertyChange('operator', e.target.value)}
                                className={commonSelectClass}
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
                            <label className={commonLabelClass}>비교값</label>
                            <input
                                type="text"
                                value={localProperties.compareValue || ''}
                                onChange={(e) => handlePropertyChange('compareValue', e.target.value)}
                                className={commonInputClass}
                                placeholder="예: 30"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default PropertyEditor;