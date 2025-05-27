import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Save, Trash2, Upload } from 'lucide-react';
import WorkflowCanvas from '../components/workflow/WorkflowCanvas';
import NodePalette from '../components/workflow/NodePalette';
import PropertyEditor from '../components/workflow/PropertyEditor';
import { saveWorkflow, getWorkflowById } from '../api/workflow';
import { getCurrentUserData } from '../services/authService';
import { API_URL } from '../config';
import { createSensor } from '../services/sensorService';

const WorkflowCanvasPage = () => {
    const [elements, setElements] = useState([]);
    const elementsRef = useRef(elements);
    useEffect(() => {
        elementsRef.current = elements;
    }, [elements]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState(null);
    const [workflowName, setWorkflowName] = useState('새 워크플로우');
    const [showImportModal, setShowImportModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const { workflowId } = useParams();
    const cyRef = useRef(null);

    // elements를 set할 때 항상 구조를 보정 (불러오기 등)
    const setElementsFiltered = useCallback((newElements) => {
        if (!Array.isArray(newElements)) {
            setElements([]);
            return;
        }
        const nodes = newElements.filter(el => el.group === 'nodes').map(normalizeNode);
        // group이 없지만 data.source/data.target이 있으면 엣지로 간주하여 group: 'edges' 부여
        let edges = newElements
            .filter(el => (el.group === 'edges') || (!el.group && el.data && el.data.source && el.data.target))
            .map(edge => ({
                group: 'edges',
                data: {
                    id: edge.data.id,
                    source: edge.data.source,
                    target: edge.data.target,
                    label: edge.data.label || '',
                    type: edge.data.type || 'default'
                }
            }));
        const allElements = [...nodes, ...edges];
        console.log('불러온 elements:', allElements);
        setElements(allElements);
    }, []);

    // 워크플로우 불러오기
    useEffect(() => {
        // elements가 의존성 배열에 들어가면 삭제/추가 시마다 불러오기 반복됨 (절대 넣지 말 것!)
        if (workflowId) {
            const fetchWorkflow = async () => {
                try {
                    const response = await getWorkflowById(workflowId);
                    if (response.success) {
                        setWorkflowName(response.workflow.name);
                        setElementsFiltered([...response.workflow.nodes, ...response.workflow.edges]);
                        console.log('[불러오기] setElementsFiltered 호출됨');
                    } else {
                        throw new Error(response.message || '워크플로우를 불러오는데 실패했습니다.');
                    }
                } catch (error) {
                    console.error('워크플로우 불러오기 실패:', error);
                    if (error.message.includes('인증') || error.message.includes('토큰')) {
                        alert('로그인이 필요합니다. 다시 로그인해주세요.');
                        navigate('/login');
                    } else {
                        alert('워크플로우를 불러오는데 실패했습니다.');
                        navigate('/workflow');
                    }
                }
            };
            fetchWorkflow();
        }
    }, [workflowId, navigate, setElementsFiltered]);

    // 노드/엣지 정규화 함수
    function normalizeNode(node) {
        return {
            group: 'nodes',
            ...node,
            data: { ...node.data }
        };
    }
    function normalizeEdge(edge) {
        return {
            group: 'edges',
            data: {
                id: edge.data?.id || edge.id,
                source: edge.data?.source || edge.source,
                target: edge.data?.target || edge.target,
                label: edge.data?.label || edge.label || '',
                type: edge.data?.type || edge.type || 'default'
            }
        };
    }

    const handleSaveWorkflow = async () => {
        if (!workflowName.trim()) {
            alert('워크플로우 이름을 입력해주세요.');
            return;
        }

        const user = getCurrentUserData();
        const userId = user?.user_id;
        if (!userId) {
            alert('로그인 정보가 올바르지 않습니다. 다시 로그인 해주세요.');
            setIsSaving(false);
            return;
        }

        setIsSaving(true);
        try {
            // 최신 elements에서 edges 추출
            const currentElements = elements;
            const edges = currentElements.filter(el => el.group === 'edges');
            console.log('[저장] 저장 직전 edges:', edges);

            let nodes = currentElements.filter(el => el.group === 'nodes').map(normalizeNode);
            let edgesToSave = edges.map(normalizeEdge);
            console.log('[저장 직전 elements]', currentElements);
            console.log('[저장 직전 edges]', edgesToSave);

            // 유효한 엣지만 필터링
            edgesToSave = filterValidEdges(nodes, edgesToSave);

            // 엣지 데이터 정규화
            edgesToSave = edgesToSave.map(edge => ({
                group: 'edges',
                data: {
                    id: edge.data.id,
                    source: edge.data.source,
                    target: edge.data.target,
                    label: edge.data.label || '',
                    type: edge.data.type || 'default'
                }
            }));

            // 노드 데이터 정규화
            nodes = nodes.map(node => ({
                group: 'nodes',
                ...node
            }));

            console.log('필터링된 엣지:', edgesToSave);

            // position 정보가 없는 노드가 있으면 Cytoscape에서 가져와서 추가
            if (cyRef.current) {
                nodes = nodes.map(node => {
                    if (!node.position) {
                        const cyNode = cyRef.current.getElementById(node.data.id);
                        if (cyNode && cyNode.position) {
                            return { ...node, position: cyNode.position() };
                        }
                    }
                    return node;
                });
            }

            // === 신규(커스텀) 센서 먼저 등록 ===
            const sensorNodes = nodes.filter(n => n.data.type === 'Sensor');
            for (const sensorNode of sensorNodes) {
                if (!sensorNode.data.sensorId) {
                    // 신규 센서 등록
                    console.log('[센서 생성 시도]', sensorNode);
                    const res = await createSensor({
                        name: sensorNode.data.label,
                        type: sensorNode.data.sensorType || 'CUSTOM',
                        description: sensorNode.data.description || '',
                        config: sensorNode.data.config || {}
                    });
                    if (res.data && res.data.success && res.data.sensor_id) {
                        sensorNode.data.sensorId = res.data.sensor_id;
                        console.log('[센서 생성 성공]', res.data.sensor_id);
                    } else if (res.success && res.sensor_id) {
                        sensorNode.data.sensorId = res.sensor_id;
                        console.log('[센서 생성 성공]', res.sensor_id);
                    } else {
                        console.error('[센서 생성 실패]', res);
                        alert('센서 등록에 실패했습니다.');
                        setIsSaving(false);
                        return;
                    }
                } else {
                    console.log('[센서 이미 존재]', sensorNode.data.sensorId);
                }
            }

            // === elements 전체 구조 상세 출력 및 id 매핑 보정 ===
            console.log('[디버깅] elements 전체:', elements);
            const nodeIdSet = new Set(nodes.map(n => n.data.id));
            elements.forEach(el => {
                if (el.group === 'nodes') {
                    console.log('노드:', el.data.id, el.data.type, el.data.deviceId, el.data.sensorId);
                }
                if (el.group === 'edges') {
                    console.log('엣지:', el.data.id, el.data.source, el.data.target);
                    if (!nodeIdSet.has(el.data.source)) {
                        console.warn('[경고] 엣지 source가 노드 id와 불일치:', el.data.source);
                    }
                    if (!nodeIdSet.has(el.data.target)) {
                        console.warn('[경고] 엣지 target이 노드 id와 불일치:', el.data.target);
                    }
                }
            });
            // === 디바이스-센서 연결 정보 추출 ===
            const deviceNodes = nodes.filter(n => n.data.type === 'Device');
            // sensorNodes는 위에서 선언된 것 재사용
            console.log('[디버깅] deviceNodes:', deviceNodes);
            console.log('[디버깅] sensorNodes:', sensorNodes);
            console.log('[디버깅] edgesToSave:', edgesToSave);
            let deviceSensorLinks = [];
            deviceNodes.forEach(deviceNode => {
                const connectedEdges = edgesToSave.filter(e => e.data.source === deviceNode.data.id);
                connectedEdges.forEach(edge => {
                    const sensorNode = nodes.find(n => n.data.id === edge.data.target && n.data.type === 'Sensor');
                    if (!sensorNode) {
                        console.warn('[디버깅] sensorNode 못 찾음:', edge.data.target, nodes);
                        console.warn('[디버깅] elements 전체:', elements);
                    }
                    // DB 컬럼명에 맞춰서 device_id, sensor_id로 명확히 매핑
                    const device_id = deviceNode.data.deviceId;
                    const sensor_id = sensorNode?.data.sensorId;
                    if (sensorNode && device_id && sensor_id) {
                        const config = {
                            ...sensorNode.data.config,
                            sensorType: sensorNode.data.sensorType || 'CUSTOM',
                            description: sensorNode.data.description || ''
                        };
                        deviceSensorLinks.push({
                            device_id,
                            sensor_id,
                            config
                        });
                        console.log('[deviceSensorLinks 추가]', {
                            device_id,
                            sensor_id,
                            config
                        });
                    } else {
                        console.warn('[deviceSensorLinks 누락] device_id:', device_id, 'sensor_id:', sensor_id, 'deviceNode:', deviceNode, 'sensorNode:', sensorNode);
                        console.warn('[디버깅] elements 전체:', elements);
                    }
                });
            });
            console.log('[deviceSensorLinks 최종]', deviceSensorLinks);

            const workflowData = {
                name: workflowName,
                description: '',
                nodes: nodes,
                edges: edgesToSave,
                userId: userId,
                isPublic: false,
                deviceSensorLinks
            };
            console.log('[워크플로우 저장 요청 데이터]', workflowData);

            let data;
            if (workflowId) {
                // 기존 워크플로우 업데이트
                const response = await fetch(`${API_URL}/workflow/${workflowId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                    },
                    body: JSON.stringify(workflowData)
                });
                data = await response.json();
                console.log('[워크플로우 수정 응답]', data);
            } else {
                // 새 워크플로우 생성
                data = await saveWorkflow(workflowData);
                console.log('[워크플로우 생성 응답]', data);
            }

            if (data.success) {
                alert('워크플로우가 저장되었습니다.');
                navigate('/workflow');
            } else {
                throw new Error(data.message || '워크플로우 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('워크플로우 저장 실패:', error);
            alert(error.message || '워크플로우 저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearCanvas = () => {
        if (window.confirm('모든 노드와 연결이 삭제됩니다. 계속하시겠습니까?')) {
            setElementsFiltered([]);
            setSelectedNode(null);
        }
    };

    const handleImportWorkflow = () => {
        setShowImportModal(true);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workflowData = JSON.parse(e.target.result);
                    setElementsFiltered(workflowData.elements || []);
                    setWorkflowName(workflowData.name || '불러온 워크플로우');
                    setShowImportModal(false);
                } catch (error) {
                    alert('워크플로우 파일을 불러오는 중 오류가 발생했습니다.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleCyInit = (cy) => {
        cyRef.current = cy;
        // 노드 클릭 이벤트 처리
        cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            setSelectedNode({
                id: node.id(),
                data: node.data()
            });
            setSelectedEdgeId(null); // 노드 클릭 시 엣지 선택 해제
        });

        // 캔버스 클릭 시 선택 해제
        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                setSelectedNode(null);
                setSelectedEdgeId(null);
            }
        });

        // 엣지 클릭 시 선택만
        cy.on('tap', 'edge', (evt) => {
            const edge = evt.target;
            setSelectedEdgeId(edge.id());
        });
    };

    const handleUpdateNode = (nodeId, updatedProps) => {
        setElements(currentElements =>
            currentElements.map(el => {
                if (el.data.id === nodeId) {
                    return {
                        ...el,
                        data: {
                            ...el.data,
                            ...updatedProps
                        }
                    };
                }
                return el;
            })
        );
        // Cytoscape 그래프 업데이트
        if (cyRef.current) {
            const node = cyRef.current.getElementById(nodeId);
            if (node.length > 0) {
                node.data(updatedProps);
            }
        }
    };

    // 엣지 정제 함수 추가
    function filterValidEdges(nodes, edges) {
        return edges.filter(edge => {
            const sourceNode = nodes.find(n => n.data.id === edge.data.source);
            const targetNode = nodes.find(n => n.data.id === edge.data.target);
            const hasRequiredData = edge.data && edge.data.source && edge.data.target && edge.data.id;
            const isDifferentNodes = edge.data.source !== edge.data.target;
            return sourceNode && targetNode && hasRequiredData && isDifferentNodes;
        });
    }

    // 내가 지운 엣지만 삭제하는 함수 (디버깅 추가)
    const handleDeleteEdge = (edgeId) => {
        console.log('[엣지삭제] 삭제 요청된 edgeId:', edgeId);
        setElements(prevElements => {
            const newElements = prevElements.filter(
                el => !(el.group === 'edges' && el.data.id === edgeId)
            );
            elementsRef.current = newElements; // 삭제 후 바로 최신 상태로 갱신
            const newEdges = newElements.filter(el => el.group === 'edges');
            console.log('[엣지삭제] 삭제 후 elements 길이:', newElements.length);
            console.log('[엣지삭제] 삭제 후 edges:', newEdges);
            return newElements;
        });
        setSelectedEdgeId(null); // 삭제 후 선택 해제
    };

    // 노드 삭제 함수
    const handleDeleteNode = (nodeId) => {
        console.log('[노드삭제] 삭제 요청된 nodeId:', nodeId);
        setElements(prevElements => {
            // 노드와 연결된 모든 엣지도 함께 삭제
            const newElements = prevElements.filter(
                el => {
                    // 노드 자체 삭제
                    if (el.group === 'nodes' && el.data.id === nodeId) {
                        return false;
                    }
                    // 해당 노드와 연결된 엣지 삭제
                    if (el.group === 'edges' && (el.data.source === nodeId || el.data.target === nodeId)) {
                        return false;
                    }
                    return true;
                }
            );
            elementsRef.current = newElements; // 삭제 후 바로 최신 상태로 갱신
            console.log('[노드삭제] 삭제 후 elements 길이:', newElements.length);
            return newElements;
        });
        setSelectedNode(null); // 삭제 후 선택 해제
        setSelectedEdgeId(null); // 연결된 엣지도 삭제되므로 엣지 선택도 해제
    };

    return (
        <div className="h-[calc(100vh-80px)] min-h-[600px] flex flex-col">
            {/* 상단 툴바 */}
            <div className="bg-white dark:bg-[#3a2e5a] shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        className="text-xl font-semibold bg-transparent border-b border-[#d1c4e9] dark:border-[#9575cd] focus:border-[#7e57c2] dark:focus:border-[#b39ddb] focus:outline-none px-2 py-1 text-[#3a2e5a] dark:text-[#b39ddb]"
                        placeholder="워크플로우 이름"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleSaveWorkflow}
                        disabled={isSaving}
                        className={`flex items-center px-3 py-2 bg-[#7e57c2] dark:bg-[#9575cd] text-white rounded-xl hover:bg-[#5e35b1] dark:hover:bg-[#b39ddb] transition-colors duration-200 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Save size={20} className="mr-2" />
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                    <button
                        onClick={handleImportWorkflow}
                        className="flex items-center px-3 py-2 bg-[#9575cd] dark:bg-[#b39ddb] text-white rounded-xl hover:bg-[#7e57c2] dark:hover:bg-[#ede7f6] transition-colors duration-200"
                    >
                        <Upload size={20} className="mr-2" />
                        불러오기
                    </button>
                    <button
                        onClick={handleClearCanvas}
                        className="flex items-center px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200"
                    >
                        <Trash2 size={20} className="mr-2" />
                        초기화
                    </button>
                </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* 왼쪽 노드 팔레트 */}
                <div className="w-60 bg-white dark:bg-[#3a2e5a] shadow-sm border-r border-[#d1c4e9] dark:border-[#9575cd] overflow-y-auto">
                    <NodePalette 
                        selectedEdgeId={selectedEdgeId}
                        onDeleteEdge={handleDeleteEdge}
                    />
                </div>

                {/* 중앙 캔버스 */}
                <div className="flex-1 bg-[#f8f6fc] dark:bg-[#2a2139] relative min-h-0">
                    <WorkflowCanvas 
                        elements={elements} 
                        setElements={setElements}
                        onCyInit={handleCyInit}
                        selectedNodeId={selectedNode?.id}
                        selectedEdgeId={selectedEdgeId}
                        handleDeleteEdge={handleDeleteEdge}
                        handleDeleteNode={handleDeleteNode}
                    />
                </div>

                {/* 오른쪽 속성 편집기 */}
                <div className="w-72 bg-white dark:bg-[#3a2e5a] shadow-sm border-l border-[#d1c4e9] dark:border-[#9575cd] overflow-y-auto">
                    <PropertyEditor 
                        selectedNode={selectedNode}
                        onUpdateNode={handleUpdateNode}
                    />
                </div>
            </div>

            {/* 불러오기 모달 */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-[#3a2e5a] rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold text-[#3a2e5a] dark:text-[#b39ddb] mb-4">
                            워크플로우 불러오기
                        </h2>
                        <div className="mb-4">
                            <input
                                type="file"
                                onChange={handleFileUpload}
                                className="w-full px-4 py-2 border border-[#d1c4e9] dark:border-[#9575cd] rounded-lg bg-white dark:bg-[#2a2139] text-[#3a2e5a] dark:text-[#b39ddb]"
                                accept=".json"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2 text-[#3a2e5a] dark:text-[#b39ddb] hover:bg-[#f8f6fc] dark:hover:bg-[#2a2139] rounded-lg transition-colors duration-200"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowCanvasPage; 