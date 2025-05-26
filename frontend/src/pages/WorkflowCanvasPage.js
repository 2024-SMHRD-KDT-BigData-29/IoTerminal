import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Save, Trash2, Upload } from 'lucide-react';
import WorkflowCanvas from '../components/workflow/WorkflowCanvas';
import NodePalette from '../components/workflow/NodePalette';
import PropertyEditor from '../components/workflow/PropertyEditor';
import { saveWorkflow, getWorkflowById } from '../api/workflow';
import { getCurrentUserData } from '../services/authService';
import { API_URL } from '../config';

const WorkflowCanvasPage = () => {
    const [elements, setElements] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [workflowName, setWorkflowName] = useState('새 워크플로우');
    const [showImportModal, setShowImportModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const { workflowId } = useParams();
    const cyRef = useRef(null);

    // 워크플로우 불러오기
    useEffect(() => {
        if (workflowId) {
            const fetchWorkflow = async () => {
                try {
                    const response = await getWorkflowById(workflowId);
                    if (response.success) {
                        setWorkflowName(response.workflow.name);
                        setElements([...response.workflow.nodes, ...response.workflow.edges]);
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
    }, [workflowId, navigate]);

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
            let nodes = elements.filter(el => el.group === 'nodes');
            let edges = elements.filter(el => el.group === 'edges');

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

            const workflowData = {
                name: workflowName,
                description: '',
                nodes: nodes,
                edges: edges,
                userId: userId,
                isPublic: false
            };

            console.log('저장될 워크플로우 데이터:', workflowData);

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
            } else {
                // 새 워크플로우 생성
                data = await saveWorkflow(workflowData);
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
            setElements([]);
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
                    setElements(workflowData.elements || []);
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
        });

        // 캔버스 클릭 시 선택 해제
        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                setSelectedNode(null);
            }
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
                    <NodePalette />
                </div>

                {/* 중앙 캔버스 */}
                <div className="flex-1 bg-[#f8f6fc] dark:bg-[#2a2139] relative min-h-0">
                    <WorkflowCanvas 
                        elements={elements} 
                        setElements={setElements}
                        onCyInit={handleCyInit}
                        selectedNodeId={selectedNode?.id}
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