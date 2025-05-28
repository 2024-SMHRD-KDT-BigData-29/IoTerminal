// File: frontend/src/components/workflow/WorkflowCanvas.js
import React, { useRef, useEffect, useCallback, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import { Trash2, Link2 } from 'lucide-react';

// Register edgehandles extension globally and only once.
if (!cytoscape.prototype.edgehandlesRegistered) {
    try {
        cytoscape.use(edgehandles);
        cytoscape.prototype.edgehandlesRegistered = true;
    } catch (e) {
        console.warn('Could not re-register edgehandles:', e);
    }
}

const baseStylesheet = [
    {
        selector: 'node',
        style: {
            'label': 'data(label)',
            'width': 70,
            'height': 70,
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#fff',
            'font-size': '15px',
            'font-weight': 'bold',
            'background-color': '#b39ddb',
            'border-color': '#9575cd',
            'border-width': 2,
            'padding': '10px',
            'text-wrap': 'wrap',
            'text-max-width': '60px',
            'transition-property': 'background-color, border-color',
            'transition-duration': '0.2s'
        }
    },
    { selector: 'node[type="Input"]', style: {
        'background-color': '#7e57c2',
        'border-color': '#5e35b1',
        'shape': 'ellipse',
        'font-weight': 'bold'
    } },
    { selector: 'node[type="Process"]', style: {
        'background-color': '#9575cd',
        'border-color': '#7e57c2',
        'shape': 'round-rectangle',
        'font-weight': 'bold'
    } },
    { selector: 'node[type="Output"]', style: {
        'background-color': '#d1c4e9',
        'border-color': '#b39ddb',
        'color': '#5e35b1',
        'shape': 'rectangle',
        'font-weight': 'bold'
    } },
    { selector: 'node[type="Condition"]', style: {
        'background-color': '#ede7f6',
        'border-color': '#b39ddb',
        'color': '#7e57c2',
        'shape': 'diamond',
        'font-weight': 'bold'
    } },
    { selector: 'node:selected', style: { 'border-color': '#7e57c2', 'border-width': 4, 'overlay-color': '#b39ddb', 'overlay-opacity': 0.18 } },
    { selector: 'edge', style: { 
        'width': 3, 
        'line-color': '#b39ddb', 
        'target-arrow-color': '#b39ddb', 
        'target-arrow-shape': 'triangle', 
        'curve-style': 'bezier', 
        'label': 'data(label)', 
        'font-size': '12px', 
        'color': '#7e57c2', 
        'text-background-opacity': 1, 
        'text-background-color': '#fff', 
        'text-background-padding': '2px',
        'line-style': 'solid',
        'arrow-scale': 1.2
    }},
    { selector: '.eh-handle', style: {
        'background-color': '#7e57c2',
        'width': 12,
        'height': 12,
        'shape': 'ellipse',
        'border-width': 2,
        'border-color': '#fff',
        'border-style': 'solid',
        'opacity': 1,
        'z-index': 9999
    }},
    { selector: '.eh-handle:active', style: {
        'background-color': '#5e35b1',
        'width': 16,
        'height': 16
    }},
    { selector: '.eh-source, .eh-target', style: {
        'border-width': 3,
        'border-color': '#7e57c2',
        'border-style': 'dashed'
    }},
    { selector: '.eh-preview, .eh-ghost-edge, .eh-ghost-edge.eh-preview-active', style: {
        'line-color': '#7e57c2',
        'target-arrow-color': '#7e57c2',
        'target-arrow-shape': 'triangle',
        'opacity': 0.7,
        'line-style': 'dashed',
        'width': 3,
        'z-index': 9999
    }},
    { selector: 'edge:selected', style: {
        'line-color': '#7e57c2',
        'target-arrow-color': '#7e57c2',
        'width': 6,
        'opacity': 1,
        'z-index': 9999,
        'shadow-blur': 8,
        'shadow-color': '#7e57c2',
        'shadow-opacity': 0.5,
        'shadow-offset-x': 0,
        'shadow-offset-y': 0,
    } },
];

function WorkflowCanvas({ elements, setElements, onCyInit, selectedNodeId, selectedEdgeId, handleDeleteEdge, handleDeleteNode }) {
    const cyRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const [isEdgeMode, setIsEdgeMode] = useState(false);
    const sourceNodeRef = useRef(null);
    const previewEdgeRef = useRef(null);

    const cyCallbackRef = useCallback(cyInstance => {
        if (cyInstance && cyRef.current !== cyInstance) {
            cyRef.current = cyInstance;
            if (onCyInit && typeof onCyInit === 'function') {
                onCyInit(cyInstance);
            }
        } else if (!cyInstance && cyRef.current) {
            cyRef.current = null;
        }
    }, [onCyInit]);

    useEffect(() => {
        const cy = cyRef.current;
        const container = canvasContainerRef.current;
        if (!cy || !container) return;

        // 기본 설정
        cy.autoungrabify(false);
        cy.panningEnabled(true);
        cy.boxSelectionEnabled(true);
        cy.zoomingEnabled(true);

        const handleDragOver = (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        };

        const handleDrop = (event) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow-nodetype');
            let label = event.dataTransfer.getData('application/reactflow-nodelabel');
            const nodeConfigString = event.dataTransfer.getData('application/reactflow-nodeconfig');
            let nodeConfig = {};
            const deviceId = event.dataTransfer.getData('application/reactflow-deviceid');
            const sensorType = event.dataTransfer.getData('application/reactflow-sensortype');
            
            if (!type) return;
            
            try {
                if (nodeConfigString) {
                    nodeConfig = JSON.parse(nodeConfigString);
                }
            } catch (e) {
                console.error("Error parsing nodeConfig from drag event:", e);
            }
            
            if (!label) label = type;
            
            const bounds = container.getBoundingClientRect();
            const pan = cy.pan();
            const zoom = cy.zoom();
            const modelX = (event.clientX - bounds.left - pan.x) / zoom;
            const modelY = (event.clientY - bounds.top - pan.y) / zoom;
            
            let nodeId = '';
            let nodeType = type;
            if (type === 'Input') {
                nodeType = 'Sensor';
            }
            let deviceIdToUse = deviceId;
            if (nodeType === 'Device') {
                if (!deviceIdToUse && label) {
                    // id에서 deviceId 추출 시도 (예: device-13)
                    const match = /device-(\d+)/.exec(label);
                    if (match) {
                        deviceIdToUse = Number(match[1]);
                    }
                }
            }
            if (nodeType === 'Device' && deviceIdToUse) {
                nodeId = `device-${deviceIdToUse}`;
            } else if (nodeType === 'Sensor') {
                nodeId = `sensor-${Date.now()}`;
            } else {
                nodeId = `${nodeType.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`;
            }
            const newNode = {
                group: 'nodes',
                data: {
                    id: nodeId,
                    label: label,
                    type: nodeType,
                    config: nodeConfig,
                    ...(deviceIdToUse ? { deviceId: Number(deviceIdToUse) } : {}),
                    ...(sensorType ? { sensorType } : {})
                },
                position: { x: modelX, y: modelY }
            };
            
            setElements(prevElements => [...prevElements, newNode]);
        };

        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);

        return () => {
            container.removeEventListener('dragover', handleDragOver);
            container.removeEventListener('drop', handleDrop);
        };
    }, [setElements]);

    // 선택된 노드 하이라이트 효과
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;

        if (selectedNodeId) {
            cy.elements().removeClass('selected');
            const selectedNode = cy.getElementById(selectedNodeId);
            if (selectedNode.length > 0) {
                selectedNode.addClass('selected');
            }
        } else {
            cy.elements().removeClass('selected');
        }
    }, [selectedNodeId]);

    // 엣지 연결 모드 및 삭제 기능
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;

        function handleNodeClick(evt) {
            const node = evt.target;
            if (!node.isNode()) return;
            if (!sourceNodeRef.current) {
                // 첫 번째 노드 선택
                sourceNodeRef.current = node;
                node.style('border-width', 3);
                node.style('border-color', '#7e57c2');
                node.style('border-style', 'dashed');
            } else {
                // 두 번째 노드 선택 - 엣지 생성
                if (sourceNodeRef.current.id() !== node.id()) {
                    const newEdgeData = {
                        group: 'edges',
                        data: {
                            id: `edge_${sourceNodeRef.current.id()}_${node.id()}_${Date.now()}`,
                            source: sourceNodeRef.current.id(),
                            target: node.id(),
                            label: '',
                            type: 'default'
                        }
                    };
                    setElements(prevElements => {
                        const edgeExists = prevElements.some(el =>
                            el.group === 'edges' &&
                            el.data.source === newEdgeData.data.source &&
                            el.data.target === newEdgeData.data.target
                        );
                        if (!edgeExists) {
                            return [...prevElements, newEdgeData];
                        }
                        return prevElements;
                    });
                }
                // 상태 초기화
                sourceNodeRef.current.style('border-width', 2);
                sourceNodeRef.current.style('border-color', '#9575cd');
                sourceNodeRef.current.style('border-style', 'solid');
                sourceNodeRef.current = null;
                if (previewEdgeRef.current) {
                    previewEdgeRef.current.remove();
                    previewEdgeRef.current = null;
                }
            }
        }

        if (isEdgeMode) {
            cy.on('tap', 'node', handleNodeClick);
        }
        return () => {
            cy.removeListener('tap', 'node', handleNodeClick);
        };
    }, [isEdgeMode, setElements]);

    // 렌더링 시 유효한 엣지만 전달
    const nodeIds = elements.filter(el => el.group === 'nodes').map(el => el.data.id);
    const validElements = elements.filter(el => {
        if (el.group === 'edges') {
            return nodeIds.includes(el.data.source) && nodeIds.includes(el.data.target);
        }
        return true;
    });

    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;
        // 노드 위치 변경 이벤트 리스너
        const handler = (evt) => {
            const node = evt.target;
            setElements(prevElements =>
                prevElements.map(el =>
                    el.group === 'nodes' && el.data.id === node.id()
                        ? { ...el, position: node.position() }
                        : el
                )
            );
        };
        cy.on('position', 'node', handler);
        return () => {
            cy.removeListener('position', 'node', handler);
        };
    }, [setElements]);

    // 키보드 이벤트 처리 (Delete 키로 삭제)
    useEffect(() => {
        const handleKeyDown = (event) => {
            // 입력 필드에 포커스가 있으면 키 이벤트를 무시
            const activeElement = document.activeElement;
            if (activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.contentEditable === 'true'
            )) {
                console.log('입력 필드에 포커스가 있어서 키 이벤트 무시:', event.key);
                return; // 입력 필드에 포커스가 있으면 아무것도 하지 않음
            }

            if (event.key === 'Delete' || event.key === 'Backspace') {
                event.preventDefault();
                console.log('캔버스에서 삭제 키 처리:', event.key);
                if (selectedNodeId && handleDeleteNode) {
                    handleDeleteNode(selectedNodeId);
                } else if (selectedEdgeId && handleDeleteEdge) {
                    handleDeleteEdge(selectedEdgeId);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedNodeId, selectedEdgeId, handleDeleteNode, handleDeleteEdge]);

    return (
        <div ref={canvasContainerRef} className="w-full h-full relative">
            <CytoscapeComponent
                elements={validElements}
                style={{ width: '100%', height: '100%' }}
                stylesheet={baseStylesheet}
                cy={cyCallbackRef}
            />
            {/* 오른쪽 상단 버튼들 */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button
                    onClick={() => {
                        setIsEdgeMode(mode => !mode);
                        sourceNodeRef.current = null;
                        previewEdgeRef.current = null;
                    }}
                    className={`p-2 rounded-full shadow transition-colors border border-purple-200 flex items-center justify-center w-10 h-10 ${
                        isEdgeMode 
                            ? 'bg-purple-500 text-white hover:bg-purple-600' 
                            : 'bg-white text-purple-700 hover:bg-purple-100'
                    }`}
                    title="엣지 연결 모드"
                >
                    <Link2 size={20} />
                </button>
                <button
                    onClick={() => selectedNodeId && handleDeleteNode(selectedNodeId)}
                    disabled={!selectedNodeId}
                    className={`p-2 rounded-full shadow border border-purple-200 flex items-center justify-center w-10 h-10 transition-colors duration-200 ${
                        selectedNodeId
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-white text-purple-300 cursor-not-allowed'
                    }`}
                    title="선택된 노드 삭제"
                >
                    <Trash2 size={20} />
                </button>
                <button
                    onClick={() => selectedEdgeId && handleDeleteEdge(selectedEdgeId)}
                    disabled={!selectedEdgeId}
                    className={`p-2 rounded-full shadow border border-purple-200 flex items-center justify-center w-10 h-10 transition-colors duration-200 ${
                        selectedEdgeId
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-white text-purple-300 cursor-not-allowed'
                    }`}
                    title="선택된 연결 삭제"
                >
                    <Trash2 size={20} />
                </button>
            </div>
            {isEdgeMode && (
                <div className="absolute top-20 right-4 bg-white/90 text-purple-700 rounded-xl shadow-lg px-4 py-2 text-xs font-semibold z-20 border border-purple-200">
                    {sourceNodeRef.current ? '연결할 노드를 클릭하세요.' : '시작 노드를 클릭하세요.'}
                </div>
            )}
        </div>
    );
}

export default WorkflowCanvas;