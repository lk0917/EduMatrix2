import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const subjectLabel = {
  english: '영어',
  coding: '코딩'
};
const subjectIcon = {
  english: '🇬🇧',
  coding: '💻'
};
const detailLabel = {
  conversation: '회화',
  grammar: '문법',
  vocab: '단어',
  python: '파이썬',
  javascript: '자바스크립트',
  html: 'HTML'
};
const detailIcon = {
  conversation: '🗣️',
  grammar: '📚',
  vocab: '📝',
  python: '🐍',
  javascript: '✨',
  html: '🌐'
};
const levelLabel = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  professional: 'Professional'
};
const levelIcon = {
  beginner: '🌱',
  intermediate: '🚀',
  advanced: '🏆',
  professional: '👑'
};

function getPlan(score, level) {
  if (score <= 4) {
    return {
      title: '기초 다지기 플랜',
      desc: '기초 개념부터 차근차근! 핵심 이론과 쉬운 실습 위주로 학습을 시작하세요.',
      color: '#b3c6ff',
      icon: '🌱',
      steps: ['핵심 개념 정리', '기초 문제 풀이', '쉬운 실전 예제', '기본 용어/문법 반복']
    };
  } else if (score <= 7) {
    return {
      title: '실력 향상 플랜',
      desc: '중급 이론과 실전 문제로 실력을 한 단계 업그레이드! 다양한 유형을 경험하세요.',
      color: '#ffe082',
      icon: '🚀',
      steps: ['중급 이론 학습', '실전 문제 풀이', '오답 노트', '실전 프로젝트/회화 연습']
    };
  } else {
    return {
      title: '심화/실전 플랜',
      desc: '고급 심화 이론과 실전 프로젝트, 실전 회화/코딩에 도전하세요!',
      color: '#ffab91',
      icon: '🏆',
      steps: ['고급 심화 이론', '실전 프로젝트/회화', '고난도 문제 풀이', '최신 트렌드/실전 적용']
    };
  }
}

function PlanRecommend() {
  const location = useLocation();
  const navigate = useNavigate();
  const { subject, detail, level, score } = location.state || {};
  const plan = getPlan(score, level);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: '#fff', borderRadius: 28, boxShadow: '0 8px 32px #0002', padding: '2.7rem 2.2rem', maxWidth: 540, width: '100%' }}>
        {/* 상단 정보 */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 10, background: 'linear-gradient(90deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', /* WebkitTextFillColor: 'transparent', */ letterSpacing: 1 }}>
            AI 맞춤 학습 계획표
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 10 }}>
            <div style={{ fontSize: 22 }}>{subjectIcon[subject]}</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{subjectLabel[subject]}</div>
            <div style={{ fontSize: 20 }}>{detailIcon[detail]}</div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{detailLabel[detail]}</div>
            <div style={{ fontSize: 20 }}>{levelIcon[level]}</div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{levelLabel[level]}</div>
          </div>
          <div style={{ color: '#111', fontWeight: 700, fontSize: 16, marginBottom: 0 }}>퀴즈 점수: {score} / 10</div>
        </div>
        {/* 추천 플랜 카드 */}
        <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 20, padding: '2.2rem 1.7rem', marginBottom: 32, boxShadow: '0 2px 12px #0001', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 18, right: 24, fontSize: 32, opacity: 0.18 }}>{plan.icon}</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, color: '#111', letterSpacing: 1 }}>{plan.title}</div>
          <div style={{ color: '#111', fontSize: 16, marginBottom: 22 }}>{plan.desc}</div>
          <div style={{ maxWidth: 340, margin: '0 auto' }}>
            {plan.steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: idx < plan.steps.length - 1 ? 14 : 0 }}>
                <div style={{ fontSize: 20, color: '#111', fontWeight: 700 }}>{idx + 1}</div>
                <div style={{ fontWeight: 600, color: '#111', fontSize: 16 }}>{step}</div>
                {idx < plan.steps.length - 1 && <div style={{ flex: 1, height: 1, background: '#1112', marginLeft: 10, marginRight: 0 }} />}
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '1rem 2.5rem',
              background: '#111',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #1112',
              transition: 'all 0.2s'
            }}
          >
            대시보드로 이동
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlanRecommend;
