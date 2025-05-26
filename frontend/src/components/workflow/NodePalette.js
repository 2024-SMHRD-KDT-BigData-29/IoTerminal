// File: frontend/src/components/workflow/NodePalette.js
import React, { useState, useEffect } from 'react';
import { Settings, Filter, Sliders as LucideSliders, BarChart, Eye, MessageSquare, Server, Database, HelpCircle, GitFork, Plus, Trash2 } from 'lucide-react';
import { getUserDevices } from '../../services/deviceService';

const nodeGroups = [
    {
        title: '입력 소스',
        nodes: [
            { 
                type: 'Sensor', 
                label: '커스텀 센서', 
                icon: <Settings size={18} className="mr-2 text-blue-500" />, 
                config: {
                    sensorType: 'custom',
                    dataSourceUrl: '',
                    customConfig: {}
                } 
            }
        ]
    },
    {
        title: '데이터 처리',
        nodes: [
            { 
                type: 'Process', 
                label: '데이터 필터링', 
                icon: <Filter size={18} className="mr-2 text-purple-500" />, 
                config: {
                    logicType: 'filter', 
                    filterCondition: ''
                } 
            },
            { 
                type: 'Process', 
                label: '데이터 보정', 
                icon: <LucideSliders size={18} className="mr-2 text-indigo-500" />, 
                config: {
                    logicType: 'calibrate', 
                    calibrationFactor: 1.0
                } 
            },
            { 
                type: 'Process', 
                label: '데이터 분석', 
                icon: <BarChart size={18} className="mr-2 text-pink-500" />, 
                config: {
                    logicType: 'analyze', 
                    analysisType: 'average'
                } 
            },
            { 
                type: 'Condition', 
                label: '조건 분기', 
                icon: <GitFork size={18} className="mr-2 text-teal-500" />, 
                config: {
                    conditionField: '', 
                    operator: '>', 
                    compareValue: ''
                } 
            }
        ]
    },
    {
        title: '출력 및 액션',
        nodes: [
            { 
                type: 'Output', 
                label: '알림 보내기', 
                icon: <MessageSquare size={18} className="mr-2 text-cyan-500" />, 
                config: {
                    outputType: 'notification', 
                    recipient: ''
                } 
            },
            { 
                type: 'Output', 
                label: '클라우드 저장', 
                icon: <Server size={18} className="mr-2 text-lime-500" />, 
                config: {
                    outputType: 'cloudStorage', 
                    bucketName: ''
                } 
            },
            { 
                type: 'Output', 
                label: 'DB에 저장', 
                icon: <Database size={18} className="mr-2 text-gray-500" />, 
                config: {
                    outputType: 'database', 
                    tableName: ''
                } 
            }
        ]
    }
];

function NodePalette({ selectedEdgeId, onDeleteEdge }) {
    const [userDevices, setUserDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadUserDevices = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const devices = await getUserDevices();
                if (Array.isArray(devices)) {
                    setUserDevices(devices);
                } else {
                    setUserDevices([]);
                    console.warn('디바이스 목록이 배열이 아닙니다:', devices);
                }
            } catch (err) {
                setError('디바이스 목록을 불러오는데 실패했습니다.');
                console.error('디바이스 목록 로드 실패:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserDevices();
    }, []);

    const onDragStart = (event, nodeType, nodeLabel, nodeConfig, extraData) => {
        let finalLabel = nodeLabel;
        let finalConfig = { ...nodeConfig };
        // 커스텀 센서일 경우 고유값 추가
        if (nodeType === 'Sensor' && nodeLabel === '커스텀 센서') {
            const uniqueSuffix = Date.now();
            finalLabel = `${nodeLabel} ${uniqueSuffix}`;
            finalConfig = { ...finalConfig, uniqueKey: uniqueSuffix };
        }
        event.dataTransfer.setData('application/reactflow-nodetype', nodeType);
        event.dataTransfer.setData('application/reactflow-nodelabel', finalLabel);
        event.dataTransfer.setData('application/reactflow-nodeconfig', JSON.stringify(finalConfig || {}));
        if (extraData && extraData.deviceId) {
            event.dataTransfer.setData('application/reactflow-deviceid', extraData.deviceId);
        }
        if (extraData && extraData.sensorType) {
            event.dataTransfer.setData('application/reactflow-sensortype', extraData.sensorType);
        }
        event.dataTransfer.effectAllowed = 'move';
    };

    // 사용자 디바이스를 노드 그룹으로 변환
    const deviceNodes = userDevices.map(device => ({
        type: 'Device',
        label: device.name,
        icon: <Settings size={18} className="mr-2 text-orange-500" />,
        config: {
            deviceId: device.device_id,
            deviceType: device.type,
            ...device.config
        },
        extraData: { deviceId: device.device_id }
    }));

    // 디바이스 그룹을 데이터 처리와 출력 및 액션 사이에 삽입
    const allNodeGroups = [
        nodeGroups[0], // 입력 소스
        nodeGroups[1], // 데이터 처리
        {
            title: '내 디바이스',
            nodes: deviceNodes
        },
        nodeGroups[2], // 출력 및 액션
    ];

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
                <h3 className="font-semibold text-sm text-gray-700">컴포넌트</h3>
                <button
                    onClick={() => selectedEdgeId && onDeleteEdge(selectedEdgeId)}
                    disabled={!selectedEdgeId}
                    className={`p-1 rounded-md transition-colors duration-200 ${
                        selectedEdgeId 
                            ? 'text-red-500 hover:bg-red-50' 
                            : 'text-gray-400 cursor-not-allowed'
                    }`}
                    title="선택된 연결 삭제"
                >
                    <Trash2 size={18} />
                </button>
            </div>
            <div className="p-4">
                {isLoading ? (
                    <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-sm p-2">{error}</div>
                ) : (
                    allNodeGroups.map(group => (
                        <div key={group.title} className="mb-5">
                            <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider px-1">{group.title}</h4>
                            <div className="space-y-1.5">
                                {group.nodes.map((node) => (
                                    <div
                                        key={node.label}
                                        onDragStart={(event) => onDragStart(event, node.type, node.label, node.config, node.extraData)}
                                        draggable
                                        className="px-3 py-2.5 bg-gray-50 rounded-md border border-gray-200 flex items-center space-x-2.5 cursor-grab hover:bg-gray-100 hover:shadow-sm active:cursor-grabbing transition-all duration-150"
                                        title={`${node.label} 추가`}
                                    >
                                        {node.icon}
                                        <span className="text-sm text-gray-800">{node.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default NodePalette;