// File: frontend/src/pages/WorkflowPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import WorkflowCanvas from '../components/workflow/WorkflowCanvas';
import NodePalette from '../components/workflow/NodePalette';
import PropertyEditor from '../components/workflow/PropertyEditor';
import { Box, Plus, Save, Trash2, Upload, Edit2, Check, X } from 'lucide-react'; // Edit2, Check, X 아이콘 추가
import { saveWorkflow, getWorkflowList, getWorkflowById, deleteWorkflow } from '../api/workflow';
import { getCurrentUserData } from '../services/authService';
import { createSensor } from '../services/sensorService';
import { API_URL } from '../config'; // API_URL import 추가

function WorkflowPage() {
    const [elements, setElements] = useState([]);
    const [workflowName, setWorkflowName] = useState('새 워크플로우');
    const navigate = useNavigate();
    const { workflowId, workflowName: urlWorkflowName } = useParams();
    const location = useLocation();

    const [selectedNode, setSelectedNode] = useState(null); // 이 상태가 핵심
    const cyRef = useRef(null); // Cytoscape 인스턴스용 ref
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const user = getCurrentUserData();
    const userId = user?.user_id;

    const [showImportModal, setShowImportModal] = useState(false);

    const [workflows, setWorkflows] = useState([]);
    
    // 워크플로우 이름 편집 상태 관리
    const [editingWorkflowId, setEditingWorkflowId] = useState(null);
    const [editingName, setEditingName] = useState('');

    const fetchWorkflows = useCallback(async () => {
        try {
            console.log('워크플로우 목록 조회 시작');
            const response = await getWorkflowList();  // getRecentWorkflows에서 getWorkflowList로 변경
            console.log('워크플로우 목록 응답:', response);
            
            if (response && response.success && Array.isArray(response.workflows)) {
                console.log('설정할 워크플로우 목록:', response.workflows);
                setWorkflows(response.workflows);
            } else {
                console.error('워크플로우 목록 형식이 잘못됨:', response);
                setWorkflows([]);
            }
        } catch (error) {
            console.error('워크플로우 목록 조회 실패:', error);
            if (error.message.includes('인증')) {
                alert('로그인이 필요합니다.');
                navigate('/login');
            } else {
                alert('워크플로우 목록을 불러오는데 실패했습니다.');
            }
            setWorkflows([]);
        }
    }, [navigate]);

    useEffect(() => {
        if (userId) {
            fetchWorkflows();
        }
    }, [userId, fetchWorkflows]);

    // 워크플로우 로드 또는 새 워크플로우 초기화
    useEffect(() => {
        // 이름 기반 상세 진입 시
        if (urlWorkflowName) {
            setIsLoading(true);
            const fetchWorkflowByName = async () => {
                try {
                    const response = await getWorkflowList();
                    if (response.success) {
                        const found = response.workflows.find(w => w.name === decodeURIComponent(urlWorkflowName));
                        if (!found) {
                            alert('해당 이름의 워크플로우를 찾을 수 없습니다.');
                            if (location.pathname !== '/workflow') navigate('/workflow');
                            return;
                        }
                        // 기존 상세 로직 재사용
                        setWorkflowName(found.name || '제목 없는 워크플로우');
                        const normalizedElements = CytoscapeComponent.normalizeElements(found.elements || []);
                        setElements(normalizedElements);
                        setSelectedNode(null);
                    } else {
                        alert(response.message || '워크플로우를 불러올 수 없습니다.');
                        if (location.pathname !== '/workflow') navigate('/workflow');
                    }
                } catch (error) {
                    alert(`워크플로우 로드 중 오류: ${error.message}`);
                    if (location.pathname !== '/workflow') navigate('/workflow');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchWorkflowByName();
            return;
        }
        // 기존 id 기반 상세 진입 로직
        if (workflowId) {
            setIsLoading(true);
            const fetchWorkflow = async () => {
                try {
                    const response = await getWorkflowById(workflowId);
                    if (response.success) {
                        // user_id 권한 체크
                        const currentUser = getCurrentUserData();
                        if (response.workflow.user_id !== currentUser?.user_id) {
                            alert('이 워크플로우에 접근 권한이 없습니다.');
                            if (location.pathname !== '/workflow') {
                                navigate('/workflow');
                            }
                            return;
                        }
                        setWorkflowName(response.workflow.name || '제목 없는 워크플로우');
                        const normalizedElements = CytoscapeComponent.normalizeElements(response.workflow.elements || []);
                        setElements(normalizedElements);
                        setSelectedNode(null);

                        if (cyRef.current) {
                           setTimeout(() => {
                                if(cyRef.current) {
                                    cyRef.current.elements().remove();
                                    cyRef.current.add(normalizedElements);
                                    cyRef.current.layout({ name: 'preset', fit: true, padding: 50 }).run();
                                }
                           }, 0);
                        }
                    } else {
                        alert(response.message || '워크플로우를 불러올 수 없습니다.');
                        if (location.pathname !== '/workflow') {
                            navigate('/workflow');
                        }
                    }
                } catch (error) {
                    if (error.message.includes('인증')) {
                        alert('로그인이 필요합니다.');
                        navigate('/login');
                    } else {
                        alert(`워크플로우 로드 중 오류: ${error.message}`);
                        if (location.pathname !== '/workflow') {
                            navigate('/workflow');
                        }
                    }
                } finally {
                    setIsLoading(false);
                }
            };
            fetchWorkflow();
        } else { // 새 워크플로우
            setElements([]); // 캔버스 초기화
            setWorkflowName('새 워크플로우 ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
            setSelectedNode(null);
            if (cyRef.current) {
                 cyRef.current.elements().remove(); // Cytoscape 캔버스도 클리어
            }
        }
    }, [workflowId, urlWorkflowName, navigate, location]); // location도 의존성에 추가

    // Cytoscape에서 노드 클릭 시 selectedNode 업데이트
    const handleCyInit = useCallback((cy) => {
        cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            setSelectedNode({
                id: node.id(),
                ...node.data()
            });
        });
        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                setSelectedNode(null);
            }
        });
    }, []);


    // PropertyEditor에서 노드 속성 업데이트 시 호출될 콜백
    const handleUpdateNode = useCallback((nodeIdToUpdate, updatedNodeProps) => { // { label, config }
        // console.log(`WorkflowPage: handleUpdateNode called for node ${nodeIdToUpdate} with:`, updatedNodeProps);
        setElements(currentElements =>
            currentElements.map(el => {
                if (el.group === 'nodes' && el.data.id === nodeIdToUpdate) {
                    return {
                        ...el,
                        data: {
                            ...el.data, // 기존 id, type 등은 유지
                            label: updatedNodeProps.label,    // 새 레이블
                            config: updatedNodeProps.config // 새 설정
                        }
                    };
                }
                return el;
            })
        );
        // PropertyEditor와 동기화를 위해 selectedNode 상태도 업데이트
        if (selectedNode && selectedNode.id === nodeIdToUpdate) {
             setSelectedNode(prevSelected => ({
                ...prevSelected, // 기존 id, type 등 유지
                label: updatedNodeProps.label,
                config: updatedNodeProps.config
            }));
        }
    }, [selectedNode, setElements]); // selectedNode가 바뀔 때 이 함수도 최신 selectedNode를 참조하도록 함

    const handleSaveWorkflow = async () => {
        if (!workflowName.trim()) {
            alert('워크플로우 이름을 입력해주세요.');
            return;
        }
        if (!cyRef.current) {
            alert('캔버스가 초기화되지 않았습니다.');
            return;
        }
        // 모든 노드의 position을 Cytoscape에서 항상 가져와서 저장
        let nodes = elements.filter(el => el.group === 'nodes').map(node => {
            const cyNode = cyRef.current.getElementById(node.data.id);
            if (cyNode && cyNode.position) {
                return { ...node, position: cyNode.position() };
            }
            return node;
        });
        const edges = elements.filter(el => el.group === 'edges');

        // === 신규(커스텀) 센서 먼저 등록 ===
        const sensorNodes = nodes.filter(n => n.data.type === 'Sensor');
        for (const sensorNode of sensorNodes) {
            if (!sensorNode.data.sensorId) {
                // 신규 센서 등록
                const res = await createSensor({
                    name: sensorNode.data.label,
                    type: sensorNode.data.sensorType || 'CUSTOM',
                    description: sensorNode.data.description || '',
                    config: sensorNode.data.config || {}
                });
                if (res.success && res.sensor_id) {
                    sensorNode.data.sensorId = res.sensor_id;
                } else {
                    alert('센서 등록에 실패했습니다.');
                    return;
                }
            }
        }

        // === 디바이스-센서 연결 정보 추출 ===
        const deviceNodes = nodes.filter(n => n.data.type === 'Device');
        let deviceSensorLinks = [];
        deviceNodes.forEach(deviceNode => {
            const connectedSensorIds = edges
                .filter(e => e.data.source === deviceNode.data.id)
                .map(e => e.data.target);
            const connectedSensors = nodes.filter(n =>
                connectedSensorIds.includes(n.data.id) && n.data.type === 'Sensor'
            );
            connectedSensors.forEach(sensorNode => {
                if (!deviceNode.data.deviceId || !sensorNode.data.sensorId) {
                    console.error('디바이스/센서 id 누락:', deviceNode, sensorNode);
                    return;
                }
                deviceSensorLinks.push({
                    device_id: deviceNode.data.deviceId,
                    sensor_id: sensorNode.data.sensorId,
                    config: sensorNode.data.config || {}
                });
            });
        });

        const workflowData = {
            name: workflowName,
            description: '',
            nodes: nodes,
            edges: edges,
            deviceSensorLinks
        };
        try {
            setIsSaving(true);
            const response = await saveWorkflow(workflowData);
            if (response.success) {
                alert('워크플로우가 저장되었습니다.');
                navigate('/workflow');
            } else {
                throw new Error(response.message || '워크플로우 저장에 실패했습니다.');
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
            setElements([]);
            setSelectedNode(null);
        }
    };

    const handleCreateNewWorkflow = () => {
        navigate('/workflow');
    };

    const handleNewWorkflow = () => {
        navigate('/workflow/new');
    };

    const handleImportWorkflow = () => {
        setShowImportModal(true);
    };

    const handleDeleteWorkflow = async (workflowId) => {
        if (window.confirm('정말로 이 워크플로우를 삭제하시겠습니까?')) {
            try {
                const response = await deleteWorkflow(workflowId);
                if (response.success) {
                    alert('워크플로우가 삭제되었습니다.');
                    fetchWorkflows(); // 목록 새로고침
                }
            } catch (error) {
                console.error('워크플로우 삭제 실패:', error);
                alert('워크플로우 삭제에 실패했습니다.');
            }
        }
    };

    // 워크플로우 이름 편집 시작
    const handleStartEditName = (workflowId, currentName) => {
        setEditingWorkflowId(workflowId);
        setEditingName(currentName);
    };

    // 워크플로우 이름 편집 취소
    const handleCancelEditName = () => {
        setEditingWorkflowId(null);
        setEditingName('');
    };

    // 워크플로우 이름 저장
    const handleSaveWorkflowName = async (workflowId) => {
        if (!editingName.trim()) {
            alert('워크플로우 이름을 입력해주세요.');
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_URL}/workflow/${workflowId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: editingName.trim()
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // 로컬 상태 업데이트
                setWorkflows(prevWorkflows =>
                    prevWorkflows.map(workflow =>
                        workflow.workflow_id === workflowId
                            ? { ...workflow, name: editingName.trim(), updated_at: new Date().toISOString() }
                            : workflow
                    )
                );
                setEditingWorkflowId(null);
                setEditingName('');
                // 성공 메시지는 조용히 처리 (사용자가 이미 변경된 것을 볼 수 있음)
            } else {
                throw new Error(data.message || '워크플로우 이름 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('워크플로우 이름 변경 실패:', error);
            alert(error.message || '워크플로우 이름 변경에 실패했습니다.');
        }
    };

    // 엔터키 처리
    const handleKeyPress = (e, workflowId) => {
        if (e.key === 'Enter') {
            handleSaveWorkflowName(workflowId);
        } else if (e.key === 'Escape') {
            handleCancelEditName();
        }
    };

    if (isLoading && workflowId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f6fc] dark:bg-[#2a2139] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-[#3a2e5a] dark:text-[#b39ddb]">
                        워크플로우 관리
                    </h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={handleNewWorkflow}
                            className="flex items-center px-4 py-2 bg-[#7e57c2] dark:bg-[#9575cd] text-white rounded-xl hover:bg-[#5e35b1] dark:hover:bg-[#b39ddb] transition-colors duration-200"
                        >
                            <Plus size={20} className="mr-2" />
                            새로 만들기
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workflows.length > 0 ? (
                        workflows.map((workflow) => (
                            <div key={workflow.workflow_id} className="bg-white dark:bg-[#3a2e5a] rounded-xl shadow-lg p-6 group">
                                <div className="flex items-center justify-between mb-2">
                                    {editingWorkflowId === workflow.workflow_id ? (
                                        <div className="flex items-center space-x-2 flex-1">
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => handleKeyPress(e, workflow.workflow_id)}
                                                onBlur={() => handleSaveWorkflowName(workflow.workflow_id)}
                                                className="flex-1 text-lg font-semibold bg-transparent border-b border-[#7e57c2] focus:outline-none text-[#3a2e5a] dark:text-[#b39ddb]"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleSaveWorkflowName(workflow.workflow_id)}
                                                className="p-1 text-green-600 hover:text-green-800"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={handleCancelEditName}
                                                className="p-1 text-red-600 hover:text-red-800"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2 flex-1">
                                            <h3 className="text-lg font-semibold text-[#3a2e5a] dark:text-[#b39ddb] cursor-pointer hover:text-[#7e57c2] dark:hover:text-[#9575cd] transition-colors"
                                                onClick={() => handleStartEditName(workflow.workflow_id, workflow.name)}
                                            >
                                                {workflow.name}
                                            </h3>
                                            <button
                                                onClick={() => handleStartEditName(workflow.workflow_id, workflow.name)}
                                                className="p-1 text-[#9575cd] hover:text-[#7e57c2] opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[#9575cd] dark:text-[#b39ddb] text-sm mb-4">
                                    마지막 수정: {new Date(workflow.updated_at).toLocaleDateString()}
                                </p>
                                <div className="flex justify-end space-x-2">
                                    <button 
                                        onClick={() => navigate(`/workflow/edit/${workflow.workflow_id}`)}
                                        className="px-3 py-1 text-sm bg-[#7e57c2] dark:bg-[#9575cd] text-white rounded-lg hover:bg-[#5e35b1] dark:hover:bg-[#b39ddb] transition-colors duration-200"
                                    >
                                        편집
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteWorkflow(workflow.workflow_id)}
                                        className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-[#9575cd] dark:text-[#b39ddb]">
                                저장된 워크플로우가 없습니다.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WorkflowPage;