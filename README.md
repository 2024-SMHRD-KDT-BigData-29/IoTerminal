# IoTerminal (팀명: 이김손)

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=venom&color=9B6B9E&height=300&section=header&text=IoTerminal&fontSize=90&animation=fadeIn&fontAlignY=38&desc=IoT%20빅데이터%20수집%20및%20관리%20시스템&descAlignY=55&descAlign=50"/>
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  .animate-fade-in {
    animation: fadeIn 1s ease-in;
  }
  .animate-slide-in {
    animation: slideIn 1s ease-out;
  }
  .animate-pulse {
    animation: pulse 2s infinite;
  }
  .hover-effect:hover {
    transform: translateY(-5px);
    transition: transform 0.3s ease;
  }
  .section {
    opacity: 0;
    animation: fadeIn 1s ease-in forwards;
  }
  .section:nth-child(1) { animation-delay: 0.1s; }
  .section:nth-child(2) { animation-delay: 0.2s; }
  .section:nth-child(3) { animation-delay: 0.3s; }
  .section:nth-child(4) { animation-delay: 0.4s; }
  .section:nth-child(5) { animation-delay: 0.5s; }
  .section:nth-child(6) { animation-delay: 0.6s; }
  .section:nth-child(7) { animation-delay: 0.7s; }
  .section:nth-child(8) { animation-delay: 0.8s; }
</style>

<div class="section">
## 📋 목차
- [서비스 소개](#-서비스-소개)
- [프로젝트 기간](#-프로젝트-기간)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [화면 구성](#-화면-구성)
- [팀원 소개](#-팀원-소개)
- [트러블슈팅](#-트러블슈팅)
</div>

<div class="section">
## 👀 서비스 소개
<div align="center">
  <h3 style="color: #9B6B9E;">IoT 빅데이터 수집 및 관리 시스템</h3>
  <p>실시간 IoT 센서 데이터 수집, 분석, 관리의 모든 것을 한 곳에서</p>
</div>
</div>

<div class="section">
## 📅 프로젝트 기간
<div align="center">
  <img src="https://img.shields.io/badge/기간-2025.04.22~2025.06.04-9B6B9E"/>
</div>
</div>

<div class="section">
## ⭐ 주요 기능
<div align="center">
  <table>
    <tr>
      <td align="center" class="hover-effect">
        <img src="https://img.shields.io/badge/IoT%20센서-스트리밍-9B6B9E"/>
        <br/>
        <b>실시간 센서 데이터 스트리밍</b>
      </td>
      <td align="center" class="hover-effect">
        <img src="https://img.shields.io/badge/워크플로우-연결-9B6B9E"/>
        <br/>
        <b>데이터 관리 워크플로우</b>
      </td>
      <td align="center" class="hover-effect">
        <img src="https://img.shields.io/badge/IoT-디바이스-9B6B9E"/>
        <br/>
        <b>IoT 디바이스 관리</b>
      </td>
    </tr>
  </table>
</div>
</div>

<div class="section">
## ⛏ 기술 스택
<div align="center">
  <table>
    <tr>
      <th style="background-color: #F5F0F7;">구분</th>
      <th style="background-color: #F5F0F7;">내용</th>
    </tr>
    <tr>
      <td>사용언어</td>
      <td>
        <img src="https://img.shields.io/badge/Java-007396?style=for-the-badge&logo=java&logoColor=white" class="hover-effect"/>
        <img src="https://img.shields.io/badge/react-61DAFB?style=for-the-badge&logo=react&logoColor=white" class="hover-effect"/>
        <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=CSS3&logoColor=white" class="hover-effect"/>
        <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=JavaScript&logoColor=white" class="hover-effect"/>
        <img src="https://img.shields.io/badge/nodedotjs-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white" class="hover-effect"/>
      </td>
    </tr>
    <tr>
      <td>라이브러리</td>
      <td>
        <img src="https://img.shields.io/badge/tailwindcss-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
        <img src="https://img.shields.io/badge/axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white"/>
        <img src="https://img.shields.io/badge/KakaoMap-FFCD00?style=for-the-badge&logo=Kakao&logoColor=white"/>
        <img src="https://img.shields.io/badge/reactrouter-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white"/>
        <img src="https://img.shields.io/badge/socketdotio-010101?style=for-the-badge&logo=socketdotio&logoColor=white"/>
        <img src="https://img.shields.io/badge/jsonwebtokens-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
      </td>
    </tr>
    <tr>
      <td>개발도구</td>
      <td>
        <img src="https://img.shields.io/badge/VSCode-007ACC?style=for-the-badge&logo=VisualStudioCode&logoColor=white"/>
      </td>
    </tr>
    <tr>
      <td>서버환경</td>
      <td>
        <img src="https://img.shields.io/badge/express-000000?style=for-the-badge&logo=express&logoColor=white"/>
      </td>
    </tr>
    <tr>
      <td>데이터베이스</td>
      <td>
        <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=MySQL&logoColor=white"/>
      </td>
    </tr>
    <tr>
      <td>협업도구</td>
      <td>
        <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=Git&logoColor=white"/>
        <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=GitHub&logoColor=white"/>
      </td>
    </tr>
  </table>
</div>
</div>

<div class="section">
## ⚙ 시스템 아키텍처
<div align="center">
  <img src="./image/system_arc.png" alt="시스템 아키텍처" width="800" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);" class="hover-effect"/>
</div>
</div>

<div class="section">
## 📌 시스템 설계
<div align="center">
  <table>
    <tr>
      <td align="center">
        <b style="color: #9B6B9E;">SW 유스케이스</b>
        <br/>
        <img src="./image/USECASE.png" width="400" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);" class="hover-effect"/>
      </td>
      <td align="center">
        <b style="color: #9B6B9E;">서비스 흐름도</b>
        <br/>
        <img src="./image/service_flows.png" width="400" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);" class="hover-effect"/>
      </td>
    </tr>
    <tr>
      <td colspan="2" align="center">
        <b style="color: #9B6B9E;">ER 다이어그램</b>
        <br/>
        <img src="./image/ER_diagram.png" width="800" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);" class="hover-effect"/>
      </td>
    </tr>
  </table>
</div>
</div>

<div class="section">
## 🖥 화면 구성
<div align="center">
  <table>
    <tr>
      <td align="center">
        <b style="color: #9B6B9E;">메인화면</b>
        <br/>
        <img src="./image/Main.png" width="400" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);" class="hover-effect"/>
      </td>
      <td align="center">
        <b style="color: #9B6B9E;">대시보드</b>
        <br/>
        <img src="./image/Dashboard.png" width="400" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);" class="hover-effect"/>
      </td>
    </tr>
    <tr>
      <td align="center">
        <b style="color: #9B6B9E;">워크플로우</b>
        <br/>
        <img src="./image/workflow.png" width="400" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);"/>
      </td>
      <td align="center">
        <b style="color: #9B6B9E;">센서 관리</b>
        <br/>
        <img src="./image/Sensor.png" width="400" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);"/>
      </td>
    </tr>
    <tr>
      <td align="center">
        <b style="color: #9B6B9E;">IoT 디바이스</b>
        <br/>
        <img src="./image/IoTdevice.png" width="400" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);"/>
      </td>
      <td align="center">
        <b style="color: #9B6B9E;">디바이스 상세</b>
        <br/>
        <img src="./image/IoTdevice2.png" width="400" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);"/>
      </td>
    </tr>
  </table>
</div>
</div>

<div class="section">
## 👨‍👩‍👦‍👦 팀원 소개
<div align="center">
  <table>
    <tr>
      <td align="center" class="hover-effect">
        <img src="https://item.kakaocdn.net/do/fd49574de6581aa2a91d82ff6adb6c0115b3f4e3c2033bfd702a321ec6eda72c" width="100" height="100" style="border-radius: 50%; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);"/>
        <br/>
        <strong style="color: #9B6B9E;">김유진</strong>
        <br/>
        <b>PM/산출문관리</b>
        <br/>
        <a href="https://github.com/kimyoojin811" target='_blank'>
          <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=GitHub&logoColor=white" class="hover-effect"/>
        </a>
      </td>
      <td align="center" class="hover-effect">
        <img src="https://mb.ntdtv.kr/assets/uploads/2019/01/Screen-Shot-2019-01-08-at-4.31.55-PM-e1546932545978.png" width="100" height="100" style="border-radius: 50%; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);"/>
        <br/>
        <strong style="color: #9B6B9E;">김양선</strong>
        <br/>
        <b>BACK-END(SUB)/<br>DB 설계 및 연동</b>
        <br/>
        <a href="https://github.com/yellow997" target='_blank'>
          <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=GitHub&logoColor=white" class="hover-effect"/>
        </a>
      </td>
      <td align="center" class="hover-effect">
        <img src="https://mblogthumb-phinf.pstatic.net/20160127_177/krazymouse_1453865104404DjQIi_PNG/%C4%AB%C4%AB%BF%C0%C7%C1%B7%BB%C1%EE_%B6%F3%C0%CC%BE%F0.png?type=w2" width="100" height="100" style="border-radius: 50%; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);"/>
        <br/>
        <strong style="color: #9B6B9E;">이석구</strong>
        <br/>
        <b>Backend/<br>Frontend</b>
        <br/>
        <a href="https://github.com/LEESTONENINE" target='_blank'>
          <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=GitHub&logoColor=white" class="hover-effect"/>
        </a>
      </td>
      <td align="center" class="hover-effect">
        <img src="https://i.pinimg.com/236x/ed/bb/53/edbb53d4f6dd710431c1140551404af9.jpg" width="100" height="100" style="border-radius: 50%; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);"/>
        <br/>
        <strong style="color: #9B6B9E;">손지수</strong>
        <br/>
        <b>Frontend(sub)/<br>영상편집및제작</b>
        <br/>
        <a href="https://github.com/sou327" target='_blank'>
          <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=GitHub&logoColor=white" class="hover-effect"/>
        </a>
      </td>
    </tr>
  </table>
</div>
</div>

<div class="section">
## 🤾‍♂️ 트러블슈팅
<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="./image/trouble.png" width="400" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);" class="hover-effect"/>
      </td>
      <td align="center">
        <img src="./image/trouble2.png" width="400" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(155, 107, 158, 0.2);" class="hover-effect"/>
      </td>
    </tr>
  </table>
</div>
</div>
