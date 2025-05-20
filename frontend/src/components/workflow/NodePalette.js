// File: frontend/src/components/workflow/NodePalette.js
import React from 'react';
import { Thermometer, Droplet, Zap, Globe as LucideGlobe, Filter, Sliders as LucideSliders, BarChart, Eye, MessageSquare, Server, Database, HelpCircle, GitFork } from 'lucide-react'; // 아이콘 임포트 확인

const nodeGroups = [
    {
        title: '입력 소스', // 한글화
        nodes: [
            { type: 'Input', label: '온도 센서', icon: <Thermometer size={18} className="mr-2 text-red-500" />, config: {sensorType: 'DHT11', dataSourceUrl: ''} },
            { type: 'Input', label: '습도 센서', icon: <Droplet size={18} className="mr-2 text-blue-500" />, config: {sensorType: 'DHT22', dataSourceUrl: ''} },
            { type: 'Input', label: '전류 센서', icon: <Zap size={18} className="mr-2 text-yellow-500" />, config: {sensorType: 'ACS712', dataSourceUrl: ''} },
            { type: 'Input', label: 'API 엔드포인트', icon: <LucideGlobe size={18} className="mr-2 text-green-500" />, config: {dataSourceUrl: 'http://api.example.com/data'} },
        ]
    },
    {
        title: '데이터 처리', // 한글화
        nodes: [
            { type: 'Process', label: '데이터 필터링', icon: <Filter size={18} className="mr-2 text-purple-500" />, config: {logicType: 'filter', filterCondition: ''} },
            { type: 'Process', label: '데이터 보정', icon: <LucideSliders size={18} className="mr-2 text-indigo-500" />, config: {logicType: 'calibrate', calibrationFactor: 1.0} },
            { type: 'Process', label: '데이터 분석', icon: <BarChart size={18} className="mr-2 text-pink-500" />, config: {logicType: 'analyze', analysisType: 'average'} },
            { type: 'Condition', label: '조건 분기', icon: <GitFork size={18} className="mr-2 text-teal-500" />, config: {conditionField: '', operator: '>', compareValue: ''} },
        ]
    },
    {
        title: '출력 및 액션', // 한글화
        nodes: [
            { type: 'Output', label: '알림 보내기', icon: <MessageSquare size={18} className="mr-2 text-cyan-500" />, config: {outputType: 'notification', recipient: ''} },
            { type: 'Output', label: '클라우드 저장', icon: <Server size={18} className="mr-2 text-lime-500" />, config: {outputType: 'cloudStorage', bucketName: ''} },
            { type: 'Output', label: '외부 API 호출', icon: <HelpCircle size={18} className="mr-2 text-orange-500" />, config: {outputType: 'apiCall', targetApiUrl: ''} },
            { type: 'Output', label: 'DB에 저장', icon: <Database size={18} className="mr-2 text-gray-500" />, config: {outputType: 'database', tableName: ''} },
        ]
    }
];


function NodePalette() {
    const onDragStart = (event, nodeType, nodeLabel, nodeConfig) => {
        event.dataTransfer.setData('application/reactflow-nodetype', nodeType);
        event.dataTransfer.setData('application/reactflow-nodelabel', nodeLabel); // 한글 레이블 전달
        event.dataTransfer.setData('application/reactflow-nodeconfig', JSON.stringify(nodeConfig || {}));
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b sticky top-0 bg-white z-10">
                <h3 className="font-semibold text-sm text-gray-700">컴포넌트</h3> {/* 한글화 */}
            </div>
            <div className="p-4">
                {nodeGroups.map(group => (
                    <div key={group.title} className="mb-5">
                        <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider px-1">{group.title}</h4> {/* 한글 그룹 제목 */}
                        <div className="space-y-1.5">
                            {group.nodes.map((node) => (
                                <div
                                    key={node.label}
                                    onDragStart={(event) => onDragStart(event, node.type, node.label, node.config)}
                                    draggable
                                    className="px-3 py-2.5 bg-gray-50 rounded-md border border-gray-200 flex items-center space-x-2.5 cursor-grab hover:bg-gray-100 hover:shadow-sm active:cursor-grabbing transition-all duration-150"
                                    title={`${node.label} 추가`} // 한글화
                                >
                                    {node.icon}
                                    <span className="text-sm text-gray-800">{node.label}</span> {/* 한글 노드 레이블 */}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default NodePalette;