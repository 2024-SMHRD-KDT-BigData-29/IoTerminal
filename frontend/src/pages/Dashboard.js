import React from 'react';
import { Activity, Box, Database, Globe, Shield, BarChart, User, Bell, Search, HelpCircle } from 'lucide-react';

// 요약 카드 컴포넌트
const SummaryCard = ({ title, value, change, up }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
    <div className="flex items-end">
      <p className="text-2xl font-semibold">{value}</p>
      <p className={`ml-2 text-sm ${up ? 'text-green-500' : 'text-red-500'}`}>{change}</p>
    </div>
  </div>
);

// 센서 상태 컴포넌트
const SensorStatus = ({ name, status, value }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case '정상': return 'bg-green-500';
      case '주의': return 'bg-yellow-500';
      case '오류': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
        <p className="text-sm">{name}</p>
      </div>
      <div className="flex items-center">
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
};

// 워크플로우 아이템 컴포넌트
const WorkflowItem = ({ name, time, status, statusColor }) => {
  const getColor = (color) => {
    switch(color) {
      case 'green': return 'text-green-500 bg-green-50';
      case 'red': return 'text-red-500 bg-red-50';
      case 'yellow': return 'text-yellow-500 bg-yellow-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${getColor(statusColor)}`}>{status}</span>
    </div>
  );
};

// API 아이템 컴포넌트
const ApiItem = ({ name, status, statusColor, calls }) => {
  const getColor = (color) => {
    switch(color) {
      case 'green': return 'text-green-500 bg-green-50';
      case 'red': return 'text-red-500 bg-red-50';
      case 'yellow': return 'text-yellow-500 bg-yellow-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-gray-500">호출: {calls}</p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${getColor(statusColor)}`}>{status}</span>
    </div>
  );
};

function Dashboard() {
  return (
    <div className="flex justify-center min-h-screen w-full bg-gray-100 py-10">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        {/* 요약 카드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <SummaryCard title="활성 센서" value="32" change="+2" up={true} />
          <SummaryCard title="수집 데이터" value="1.8M" change="+12%" up={true} />
          <SummaryCard title="오류율" value="2.4%" change="-0.6%" up={false} />
          <SummaryCard title="API 호출" value="25K" change="+5%" up={true} />
        </div>
        {/* 차트/센서 상태 섹션 (차트는 샘플 div로 대체) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6 col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">실시간 데이터 흐름</h3>
              <div className="flex items-center space-x-2">
                <select className="text-sm px-2 py-1 rounded border focus:outline-none">
                  <option>오늘</option>
                  <option>이번 주</option>
                  <option>이번 달</option>
                </select>
              </div>
            </div>
            <div className="h-64 w-full bg-gray-50 rounded flex items-center justify-center">
              <span className="text-gray-400">센서 데이터 시각화 차트</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">센서 상태</h3>
              <button className="text-blue-500 text-sm">모두 보기</button>
            </div>
            <div className="space-y-4">
              <SensorStatus name="온도 센서 (DHT11)" status="정상" value="23.5°C" />
              <SensorStatus name="습도 센서 (DHT11)" status="정상" value="45%" />
              <SensorStatus name="전류 센서 (ACS712)" status="주의" value="2.4A" />
              <SensorStatus name="압력 센서 (BMP180)" status="오류" value="--" />
              <SensorStatus name="가스 센서 (MQ-2)" status="정상" value="412ppm" />
            </div>
          </div>
        </div>
        {/* 워크플로우/연동 상태 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">최근 워크플로우</h3>
              <button className="text-blue-500 text-sm">추가하기</button>
            </div>
            <div className="space-y-3">
              <WorkflowItem name="온도 모니터링 및 알림" time="10분 전" status="실행 중" statusColor="green" />
              <WorkflowItem name="생산 데이터 수집" time="1시간 전" status="실행 중" statusColor="green" />
              <WorkflowItem name="재고 알림 자동화" time="3시간 전" status="일시 중지" statusColor="yellow" />
              <WorkflowItem name="전력 소비 분석" time="어제" status="오류" statusColor="red" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">API 연동 상태</h3>
              <button className="text-blue-500 text-sm">관리</button>
            </div>
            <div className="space-y-3">
              <ApiItem name="네이버 클라우드" status="연결됨" statusColor="green" calls="2.3K" />
              <ApiItem name="카카오톡 알림" status="연결됨" statusColor="green" calls="847" />
              <ApiItem name="토스 결제" status="인증 필요" statusColor="yellow" calls="0" />
              <ApiItem name="공공 데이터 포털" status="연결됨" statusColor="green" calls="1.1K" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 