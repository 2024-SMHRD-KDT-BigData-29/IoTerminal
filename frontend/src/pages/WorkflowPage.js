// File: frontend/src/pages/WorkflowPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import WorkflowCanvas from '../components/workflow/WorkflowCanvas';
import NodePalette from '../components/workflow/NodePalette';
import PropertyEditor from '../components/workflow/PropertyEditor';
import { Box, Plus, Save, Trash2, Upload } from 'lucide-react'; // 사용되는 아이콘만
import { saveWorkflow, getWorkflowList, getWorkflowById, deleteWorkflow } from '../api/workflow';
import { getCurrentUserData } from '../services/authService';

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

    const fetchWorkflows = useCallback(async () => {
        try {
            const response = await getWorkflowList();
            if (response.success) {
                setWorkflows(response.workflows);
            }
        } catch (error) {
            console.error('워크플로우 목록 조회 실패:', error);
            if (error.message.includes('인증')) {
                alert('로그인이 필요합니다.');
                navigate('/login');
            } else {
                alert('워크플로우 목록을 불러오는데 실패했습니다.');
            }
        }
    }, [navigate]);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

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
        // TODO: API 호출하여 워크플로우 저장
        console.log('Saving workflow:', { name: workflowName, elements });
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflows.length > 0 ? (
                        workflows.map((workflow) => (
                            <div key={workflow.workflow_id} className="bg-white dark:bg-[#3a2e5a] rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-[#3a2e5a] dark:text-[#b39ddb] mb-2">
                                    {workflow.name}
                                </h3>
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