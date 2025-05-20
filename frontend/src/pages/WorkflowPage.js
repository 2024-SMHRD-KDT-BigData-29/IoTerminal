// File: frontend/src/pages/WorkflowPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import WorkflowCanvas from '../components/workflow/WorkflowCanvas';
import NodePalette from '../components/workflow/NodePalette';
import PropertyEditor from '../components/workflow/PropertyEditor';
import { Box, Plus, Save, Trash2 } from 'lucide-react'; // 사용되는 아이콘만
import { saveWorkflow, getWorkflows, getWorkflowById, updateWorkflow } from '../services/workflowService';
import { getCurrentUserData } from '../services/authService';

function WorkflowPage() {
    const [elements, setElements] = useState([]);
    const [workflowName, setWorkflowName] = useState('새 워크플로우');
    const navigate = useNavigate();
    const { workflowId } = useParams();

    const [selectedNode, setSelectedNode] = useState(null); // 이 상태가 핵심
    const cyRef = useRef(null); // Cytoscape 인스턴스용 ref
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const currentUserData = getCurrentUserData();
    const username = currentUserData?.username || '사용자';

    // 워크플로우 로드 또는 새 워크플로우 초기화
    useEffect(() => {
        if (workflowId) {
            setIsLoading(true);
            const fetchWorkflow = async () => {
                try {
                    const existingWorkflow = await getWorkflowById(workflowId);
                    if (existingWorkflow) {
                        setWorkflowName(existingWorkflow.name || '제목 없는 워크플로우');
                        const normalizedElements = CytoscapeComponent.normalizeElements(existingWorkflow.elements || []);
                        setElements(normalizedElements);
                        setSelectedNode(null); // 새 워크플로우 로드 시 선택 해제

                        if (cyRef.current) {
                           setTimeout(() => { // Cytoscape 업데이트는 비동기적으로
                                if(cyRef.current) {
                                    cyRef.current.elements().remove();
                                    cyRef.current.add(normalizedElements);
                                    cyRef.current.layout({ name: 'preset', fit: true, padding: 50 }).run();
                                }
                           }, 0);
                        }
                    } else {
                        alert(`ID '${workflowId}' 워크플로우를 찾을 수 없습니다.`);
                        navigate('/workflow-builder'); // 새 워크플로우 페이지로 리디렉션
                    }
                } catch (error) {
                    alert(`워크플로우 '${workflowId}' 로드 중 오류: ${error.message}`);
                    navigate('/workflow-builder');
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
    }, [workflowId, navigate]); // workflowId 변경 시 실행


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

    if (isLoading && workflowId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* 상단 툴바 */}
            <div className="bg-white shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        className="text-xl font-semibold bg-transparent border-b border-purple-300 focus:border-purple-400 focus:outline-none px-2 py-1"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleCreateNewWorkflow}
                        className="flex items-center px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                    >
                        <Plus size={20} className="mr-2" />
                        새로 만들기
                    </button>
                    <button
                        onClick={handleSaveWorkflow}
                        className="flex items-center px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                    >
                        <Save size={20} className="mr-2" />
                        저장
                    </button>
                    <button
                        onClick={handleClearCanvas}
                        className="flex items-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                        <Trash2 size={20} className="mr-2" />
                        초기화
                    </button>
                </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 flex overflow-hidden">
                {/* 왼쪽 노드 팔레트 */}
                <div className="w-60 bg-white shadow-sm border-r overflow-y-auto">
                    <NodePalette />
                </div>

                {/* 중앙 캔버스 */}
                <div className="flex-1 bg-purple-50 relative">
                    <WorkflowCanvas 
                        elements={elements} 
                        setElements={setElements}
                        onCyInit={handleCyInit} // 자식에게 콜백 전달
                        selectedNodeId={selectedNode ? selectedNode.id : null} // 선택된 노드 ID 전달
                    />
                </div>

                {/* 오른쪽 속성 편집기 */}
                <div className="w-72 bg-white shadow-sm border-l overflow-y-auto">
                    <PropertyEditor 
                        selectedNode={selectedNode}
                        onUpdateNode={handleUpdateNode} // 업데이트 콜백 전달
                    />
                </div>
            </div>
        </div>
    );
}

export default WorkflowPage;