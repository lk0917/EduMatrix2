import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getCategoryReport } from '../services/quizService';

// JSON 데이터 파싱 및 포맷팅 함수들
const parseDetailedReport = (detailedReport) => {
  if (!detailedReport) return null;
  
  try {
    // 문자열인 경우 JSON 파싱 시도
    if (typeof detailedReport === 'string') {
      // JSON 형태인지 확인
      if (detailedReport.trim().startsWith('{') || detailedReport.trim().startsWith('[')) {
        try {
          return JSON.parse(detailedReport);
        } catch (e) {
          // JSON 파싱 실패시 원본 텍스트 반환
          return { rawText: detailedReport };
        }
      }
      return { rawText: detailedReport };
    }
    
    // 이미 객체인 경우 그대로 반환
    return detailedReport;
  } catch (error) {
    console.error('상세 보고서 파싱 실패:', error);
    return { rawText: String(detailedReport) };
  }
};

// 자유형 텍스트(rawText)를 구조화된 보고서 객체로 변환
// 예상 포맷 예시를 기반으로 정규식으로 주요 필드만 추출하여 매핑합니다.
const parseRawTextToStructuredReport = (rawText) => {
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    return null;
  }

  const safeMatch = (regex, idx = 1) => {
    const m = rawText.match(regex);
    return m && m[idx] ? m[idx].trim() : undefined;
  };

  // meta
  const meta = {
    goal: safeMatch(/"goal"\s+"([^"]+)"/i),
    testType: safeMatch(/"testType"\s+"([^"]+)"/i),
    testCount: (() => {
      const v = safeMatch(/"testCount"\s+(\d+)/i);
      return v ? Number(v) : undefined;
    })(),
    date: safeMatch(/"timestamp"\s+"([^"]+)"/i) || safeMatch(/\((\d{4}-\d{2}-\d{2}[^)]*)\)/),
  };

  // score
  const score = {
    raw: (() => { const v = safeMatch(/"score"[\s\S]*?"raw"\s+(\d+)/i); return v ? Number(v) : undefined; })(),
    total: (() => { const v = safeMatch(/"score"[\s\S]*?"total"\s+(\d+)/i); return v ? Number(v) : undefined; })(),
    percent: (() => { const v = safeMatch(/"score"[\s\S]*?"percent"\s+(\d+)/i); return v ? Number(v) : undefined; })(),
  };

  // progress
  const progress = {
    currentProgressPercent: (() => { const v = safeMatch(/"progress"[\s\S]*?"currentProgressPercent"\s+(\d+)/i); return v ? Number(v) : undefined; })(),
    previousProgressPercent: (() => { const v = safeMatch(/"progress"[\s\S]*?"previousProgressPercent"\s+(\d+)/i); return v ? Number(v) : undefined; })(),
    deltaPercent: (() => { const v = safeMatch(/"progress"[\s\S]*?"deltaPercent"\s+(\d+)/i); return v ? Number(v) : undefined; })(),
    confidence: safeMatch(/"progress"[\s\S]*?"confidence"\s+"([^"]+)"/i),
    estCompletionDate: safeMatch(/"progress"[\s\S]*?"estCompletionDate"\s+"([^"]+)"/i),
    rationale: safeMatch(/"progress"[\s\S]*?"rationale"\s*:\s*"([^"]+)"/i)
  };

  // topicMastery
  const topicMastery = [];
  const topicRegex = /"topic"\s+"([^"]+)"[\s\S]*?"masteryPercent"\s+(\d+)/gi;
  let tm;
  while ((tm = topicRegex.exec(rawText)) !== null) {
    topicMastery.push({ topic: tm[1].trim(), mastery: Number(tm[2]) });
  }

  // wrongAnalysis
  const wrongAnalysis = [];
  const waRegex = /\{[\s\S]*?"question"\s+(\d+)[\s\S]*?"errorType"\s+"([^"]+)"[\s\S]*?"cause"\s+"([^"]+)"[\s\S]*?"immediateSolution"\s+"([^"]+)"[\s\S]*?"reference"\s+"([^"]+)"[\s\S]*?\}/gi;
  let wa;
  while ((wa = waRegex.exec(rawText)) !== null) {
    wrongAnalysis.push({
      questionNumber: Number(wa[1]),
      errorType: wa[2].trim(),
      cause: wa[3].trim(),
      immediateFix: wa[4].trim(),
      reference: wa[5].trim()
    });
  }

  // patterns
  const patterns = {
    strengths: safeMatch(/"patterns"[\s\S]*?"strengths"\s+"([^"]+)"/i),
    weaknesses: safeMatch(/"patterns"[\s\S]*?"weaknesses"\s+"([^"]+)"/i),
    systemicRisks: safeMatch(/"patterns"[\s\S]*?"systemicRisks"\s+"([^"]+)"/i)
  };

  // actionPlan next7Days
  const next7Days = [];
  const dayRegex = /"Day\s+(\d+)"\s*:\s*\{[\s\S]*?"focus"\s*:\s*"([^"]+)"[\s\S]*?"tasks"\s*:\s*"([^"]+)"[\s\S]*?"time"\s*:\s*"([^"]+)"[\s\S]*?\}/gi;
  let day;
  while ((day = dayRegex.exec(rawText)) !== null) {
    next7Days.push({ day: Number(day[1]), focus: day[2].trim(), tasks: day[3].split(/,\s*|\s*·\s*|\s*•\s*/).filter(Boolean), time: day[4].trim() });
  }

  // practiceSet
  const practiceSet = {
    questionCount: (() => { const v = safeMatch(/"practiceSet"[\s\S]*?"numberOfQuestions"\s+(\d+)/i); return v ? Number(v) : undefined; })(),
    difficulty: safeMatch(/"practiceSet"[\s\S]*?"difficulty"\s+"([^"]+)"/i),
    format: safeMatch(/"practiceSet"[\s\S]*?"format"\s+"([^"]+)"/i)
  };

  // milestoneToGoal
  const milestoneToGoal = {
    currentProgress: (() => { const v = safeMatch(/"milestoneToGoal"[\s\S]*?"progressPercent"\s+(\d+)/i); return v ? Number(v) : undefined; })(),
    nextCheckpoint: safeMatch(/"milestoneToGoal"[\s\S]*?"nextCheckpoint"\s+"([^"]+)"/i),
    bottleneckFactors: (() => { const v = safeMatch(/"milestoneToGoal"[\s\S]*?"bottleneck"\s+"([^"]+)"/i); return v ? [v] : undefined; })()
  };

  // nextTestPlan
  const nextTestPlan = {
    recommendedDate: safeMatch(/"nextTestPlan"[\s\S]*?"date"\s+"([^"]+)"/i),
    focusAreas: safeMatch(/"nextTestPlan"[\s\S]*?"goals"\s+"([^"]+)"/i),
  };

  // reflection
  const reflection = {
    prompt: safeMatch(/"reflection"[\s\S]*?"prompt"\s+"([^"]+)"/i),
    habitTip: safeMatch(/"reflection"[\s\S]*?"habitTip"\s+"([^"]+)"/i)
  };

  // badges
  const badges = [];
  const badgeBlock = safeMatch(/"badges"\s*\[([\s\S]*?)\]/i, 1);
  if (badgeBlock) {
    const m = [...badgeBlock.matchAll(/"([^"]+)"/g)].map((b) => b[1]);
    if (m.length > 0) badges.push(...m);
  }

  const result = {};
  if (meta.goal || meta.testType || meta.testCount || meta.date) result.meta = meta;
  if (score.raw !== undefined || score.total !== undefined || score.percent !== undefined) result.score = score;
  if (progress.currentProgressPercent !== undefined || progress.previousProgressPercent !== undefined || progress.deltaPercent !== undefined || progress.confidence || progress.estCompletionDate || progress.rationale) result.progress = progress;
  if (topicMastery.length > 0) result.topicMastery = topicMastery;
  if (wrongAnalysis.length > 0) result.wrongAnalysis = wrongAnalysis;
  if (patterns.strengths || patterns.weaknesses || patterns.systemicRisks) result.patterns = patterns;
  if (next7Days.length > 0) result.actionPlan = { next7Days };
  if (practiceSet.questionCount || practiceSet.difficulty || practiceSet.format) result.practiceSet = practiceSet;
  if (milestoneToGoal.currentProgress !== undefined || milestoneToGoal.nextCheckpoint || milestoneToGoal.bottleneckFactors) result.milestoneToGoal = milestoneToGoal;
  if (nextTestPlan.recommendedDate || nextTestPlan.focusAreas) result.nextTestPlan = nextTestPlan;
  if (reflection.prompt || reflection.habitTip) result.reflection = reflection;
  if (badges.length > 0) result.badges = badges;

  return Object.keys(result).length > 0 ? result : null;
};


// 점수에 따른 성과 등급 계산
const getPerformanceGrade = (score, totalQuestions = 10) => {
  const percentage = (score / totalQuestions) * 100;
  if (percentage >= 90) return { grade: 'A+', color: '#28a745', label: '우수' };
  if (percentage >= 80) return { grade: 'A', color: '#28a745', label: '양호' };
  if (percentage >= 70) return { grade: 'B+', color: '#ffc107', label: '보통' };
  if (percentage >= 60) return { grade: 'B', color: '#fd7e14', label: '개선 필요' };
  return { grade: 'C', color: '#dc3545', label: '많은 개선 필요' };
};


// 새로운 프롬프트 기반 상세 보고서 렌더러
const DetailedReportRenderer = ({ reportData }) => {
  console.log('DetailedReportRenderer - reportData:', reportData);
  console.log('DetailedReportRenderer - reportData keys:', Object.keys(reportData || {}));
  console.log('DetailedReportRenderer - reportData.meta:', reportData?.meta);
  console.log('DetailedReportRenderer - reportData.score:', reportData?.score);
  console.log('DetailedReportRenderer - reportData.progress:', reportData?.progress);
  if (!reportData) return null;

  // 새로운 JSON 스키마에 맞는 렌더링
  const renderMetaSection = (meta) => {
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          📋 테스트 정보
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <strong>목표:</strong> {meta?.goal || '학습 분석'}
          </div>
          <div>
            <strong>테스트 유형:</strong> {meta?.testType || '종합 평가'}
          </div>
          <div>
            <strong>회차:</strong> {meta?.testCount || '1'}회차
          </div>
          <div>
            <strong>날짜:</strong> {meta?.date ? new Date(meta.date).toLocaleDateString() : new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  };

  const renderScoreSection = (score) => {
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          🎯 점수 분석
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div>
            <strong>점수:</strong> {score?.raw || 0}/{score?.total || 10}
          </div>
          <div>
            <strong>정답률:</strong> {score?.percent || 0}%
          </div>
        </div>
      </div>
    );
  };

  const renderProgressSection = (progress) => {
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          📈 학습 진행도
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <strong>현재 진행도:</strong> {progress?.currentProgressPercent || 0}%
          </div>
          <div>
            <strong>이전 진행도:</strong> {progress?.previousProgressPercent || 0}%
          </div>
          <div>
            <strong>변화폭:</strong> {progress?.deltaPercent || 0}%p
          </div>
          <div>
            <strong>신뢰도:</strong> {progress?.confidence || 'medium'}
          </div>
          <div>
            <strong>예상 완료일:</strong> {progress?.estCompletionDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
          <strong>산정 근거:</strong> {progress?.rationale || '기본 분석 기준 적용'}
        </div>
      </div>
    );
  };

  const renderTopicMasterySection = (topicMastery) => {
    const defaultTopics = [
      { topic: '언어 이해', mastery: 9 },
      { topic: '기술적 이해', mastery: 15 }
    ];
    
    const topics = Array.isArray(topicMastery) && topicMastery.length > 0 ? topicMastery : defaultTopics;
    
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          🧭 주제별 숙련도
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {topics.map((topic, idx) => (
            <div key={idx} style={{ 
              padding: '0.8rem', 
              background: '#fff', 
              borderRadius: 6, 
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{topic.topic}</div>
              <div style={{ 
                fontSize: 18, 
                fontWeight: 700, 
                color: topic.mastery >= 80 ? '#28a745' : topic.mastery >= 60 ? '#ffc107' : '#dc3545'
              }}>
                {topic.mastery}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWrongAnalysisSection = (wrongAnalysis) => {
    const defaultAnalysis = [
      {
        questionNumber: 1,
        topic: '언어 이해',
        errorType: '개념 이해 부족',
        cause: '기본 개념 미흡',
        immediateFix: '개념 재정리',
        reference: '학습 노트 1장 참조'
      },
      {
        questionNumber: 2,
        topic: '기술적 이해',
        errorType: '계산 실수',
        cause: '반복 연습 부족',
        immediateFix: '유사 문제 반복',
        reference: '학습 노트 3장 참조'
      }
    ];
    
    const analysis = Array.isArray(wrongAnalysis) && wrongAnalysis.length > 0 ? wrongAnalysis : defaultAnalysis;
    
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          ❌ 틀린 문제 분석
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {analysis.map((item, idx) => (
            <div key={idx} style={{ 
              padding: '1rem', 
              background: '#fff', 
              borderRadius: 6, 
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Q{item.questionNumber}: {item.topic}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, fontSize: 14 }}>
                <div><strong>오류 유형:</strong> {item.errorType}</div>
                <div><strong>원인:</strong> {item.cause}</div>
                <div><strong>즉시 수정:</strong> {item.immediateFix}</div>
                {item.reference && (
                  <div><strong>참고자료:</strong> {item.reference}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPatternsSection = (patterns) => {
    if (!patterns) return null;
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          📊 학습 패턴 분석
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {patterns.strengths && (
            <div>
              <h5 style={{ color: '#28a745', fontWeight: 600, marginBottom: 8 }}>✅ 강점</h5>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {Array.isArray(patterns.strengths) ? patterns.strengths.map((strength, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{strength}</li>
                )) : <li>{patterns.strengths}</li>}
              </ul>
            </div>
          )}
          {patterns.weaknesses && (
            <div>
              <h5 style={{ color: '#ffc107', fontWeight: 600, marginBottom: 8 }}>⚠️ 약점</h5>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {Array.isArray(patterns.weaknesses) ? patterns.weaknesses.map((weakness, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{weakness}</li>
                )) : <li>{patterns.weaknesses}</li>}
              </ul>
            </div>
          )}
          {patterns.systemicRisks && (
            <div>
              <h5 style={{ color: '#dc3545', fontWeight: 600, marginBottom: 8 }}>🚨 리스크</h5>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {Array.isArray(patterns.systemicRisks) ? patterns.systemicRisks.map((risk, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{risk}</li>
                )) : <li>{patterns.systemicRisks}</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActionPlanSection = (actionPlan) => {
    if (!actionPlan) return null;
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          🗓️ 7일 학습 계획
        </h4>
        
        {actionPlan.next7Days && (
          <div style={{ marginBottom: 16 }}>
            <h5 style={{ fontWeight: 600, marginBottom: 8 }}>일별 계획</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              {actionPlan.next7Days.map((day, idx) => (
                <div key={idx} style={{ 
                  padding: '0.8rem', 
                  background: '#fff', 
                  borderRadius: 6, 
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ fontWeight: 600, color: '#20c997' }}>Day {day.day}</div>
                  <div style={{ fontSize: 14, marginBottom: 4 }}>{day.focus}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{day.time}</div>
                  {day.tasks && (
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, fontSize: 12 }}>
                      {day.tasks.map((task, taskIdx) => (
                        <li key={taskIdx}>{task}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {actionPlan.microGoals && (
          <div style={{ marginBottom: 16 }}>
            <h5 style={{ fontWeight: 600, marginBottom: 8 }}>🎯 마이크로 목표</h5>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {Array.isArray(actionPlan.microGoals) ? actionPlan.microGoals.map((goal, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{goal}</li>
              )) : <li>{actionPlan.microGoals}</li>}
            </ul>
          </div>
        )}

        {actionPlan.resources && (
          <div>
            <h5 style={{ fontWeight: 600, marginBottom: 8 }}>📚 추천 자료</h5>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {Array.isArray(actionPlan.resources) ? actionPlan.resources.map((resource, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{resource}</li>
              )) : <li>{actionPlan.resources}</li>}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderPracticeSetSection = (practiceSet) => {
    if (!practiceSet) return null;
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          🧪 맞춤 실습 세트
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div>
            <strong>문항수:</strong> {practiceSet.questionCount}문제
          </div>
          <div>
            <strong>난이도:</strong> {practiceSet.difficulty}
          </div>
          <div>
            <strong>형식:</strong> {practiceSet.format}
          </div>
        </div>
      </div>
    );
  };

  const renderMilestoneSection = (milestoneToGoal) => {
    if (!milestoneToGoal) return null;
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          🏁 목표 진행률
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <strong>현재 진행률:</strong> {milestoneToGoal.currentProgress}%
          </div>
          <div>
            <strong>다음 체크포인트:</strong> {milestoneToGoal.nextCheckpoint}%
          </div>
        </div>
        {milestoneToGoal.bottleneckFactors && (
          <div style={{ marginTop: 12 }}>
            <h5 style={{ fontWeight: 600, marginBottom: 8 }}>병목 요소</h5>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {Array.isArray(milestoneToGoal.bottleneckFactors) ? milestoneToGoal.bottleneckFactors.map((factor, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{factor}</li>
              )) : <li>{milestoneToGoal.bottleneckFactors}</li>}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderNextTestPlanSection = (nextTestPlan) => {
    if (!nextTestPlan) return null;
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          🧭 다음 테스트 계획
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {nextTestPlan.recommendedDate && (
            <div>
              <strong>권장 날짜:</strong> {nextTestPlan.recommendedDate}
            </div>
          )}
          {nextTestPlan.focusAreas && (
            <div>
              <strong>집중 영역:</strong> {Array.isArray(nextTestPlan.focusAreas) ? nextTestPlan.focusAreas.join(', ') : nextTestPlan.focusAreas}
            </div>
          )}
          {nextTestPlan.preparation && (
            <div>
              <strong>준비 사항:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
                {Array.isArray(nextTestPlan.preparation) ? nextTestPlan.preparation.map((prep, idx) => (
                  <li key={idx}>{prep}</li>
                )) : <li>{nextTestPlan.preparation}</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReflectionSection = (reflection) => {
    if (!reflection) return null;
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          🪞 자기 성찰
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reflection.prompt && (
            <div>
              <strong>질문:</strong> {reflection.prompt}
            </div>
          )}
          {reflection.habitTip && (
            <div>
              <strong>습관 팁:</strong> {reflection.habitTip}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBadgesSection = (badges) => {
    if (!Array.isArray(badges) || badges.length === 0) return null;
    return (
      <div style={{ 
        marginBottom: 20, 
        padding: '1rem', 
        background: '#ffffff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1976d2' }}>
          🏅 획득 배지
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {badges.map((badge, idx) => (
            <span key={idx} style={{ 
              padding: '0.4rem 0.8rem', 
              background: '#fff', 
              borderRadius: 20, 
              border: '1px solid #fd7e14',
              color: '#fd7e14',
              fontSize: 14,
              fontWeight: 600
            }}>
              {badge}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // rawText가 있는 경우: 자유 텍스트를 구조화된 보고서로 변환하여 렌더링
  if (reportData.rawText) {
    const structured = parseRawTextToStructuredReport(reportData.rawText);
    if (structured) {
      return (
        <div>
          {renderMetaSection(structured.meta)}
          {renderScoreSection(structured.score)}
          {renderProgressSection(structured.progress)}
          {renderTopicMasterySection(structured.topicMastery)}
          {renderWrongAnalysisSection(structured.wrongAnalysis)}
          {renderPatternsSection(structured.patterns)}
          {renderActionPlanSection(structured.actionPlan)}
          {renderPracticeSetSection(structured.practiceSet)}
          {renderMilestoneSection(structured.milestoneToGoal)}
          {renderNextTestPlanSection(structured.nextTestPlan)}
          {renderReflectionSection(structured.reflection)}
          {renderBadgesSection(structured.badges)}
        </div>
      );
    }
  }

  // 모든 데이터를 구조화된 형태로 강제 렌더링
  return (
    <div>
      {renderMetaSection(reportData.meta)}
      {renderScoreSection(reportData.score)}
      {renderProgressSection(reportData.progress)}
      {renderTopicMasterySection(reportData.topicMastery)}
      {renderWrongAnalysisSection(reportData.wrongAnalysis)}
      {renderPatternsSection(reportData.patterns)}
      {renderActionPlanSection(reportData.actionPlan)}
      {renderPracticeSetSection(reportData.practiceSet)}
      {renderMilestoneSection(reportData.milestoneToGoal)}
      {renderNextTestPlanSection(reportData.nextTestPlan)}
      {renderReflectionSection(reportData.reflection)}
      {renderBadgesSection(reportData.badges)}
    </div>
  );
};

// 기존 피드백 섹션 렌더러 (하위 호환성 유지)
const FeedbackSectionRenderer = ({ feedbackData }) => {
  console.log('FeedbackSectionRenderer - feedbackData:', feedbackData);
  if (!feedbackData) return null;

  // 새로운 프롬프트 기반 데이터인지 확인
  if (feedbackData.meta && feedbackData.score && feedbackData.progress) {
    console.log('FeedbackSectionRenderer - 새로운 프롬프트 데이터 감지, DetailedReportRenderer 호출');
    return <DetailedReportRenderer reportData={feedbackData} />;
  }

  // 일반적인 피드백 구조 감지 및 렌더링
  const renderFeedbackSection = (sectionData, sectionTitle, sectionIcon, sectionColor) => {
    if (!sectionData) return null;

    return (
      <div style={{ 
        marginBottom: 16, 
        padding: '1rem', 
        background: `linear-gradient(135deg, ${sectionColor}15, ${sectionColor}08)`, 
        borderRadius: 8, 
        borderLeft: `4px solid ${sectionColor}`,
        border: `1px solid ${sectionColor}30`
      }}>
        <h4 style={{ 
          fontSize: 15, 
          fontWeight: 700, 
          marginBottom: 10, 
          color: sectionColor,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          {sectionIcon} {sectionTitle}
        </h4>
        
        {Array.isArray(sectionData) ? (
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {sectionData.map((item, idx) => (
              <li key={idx} style={{ 
                marginBottom: 6, 
                fontSize: 14, 
                lineHeight: 1.6,
                color: '#333'
              }}>
                {typeof item === 'object' ? JSON.stringify(item, null, 2) : item}
              </li>
            ))}
          </ul>
        ) : typeof sectionData === 'object' ? (
          <div style={{ 
            fontSize: 14, 
            lineHeight: 1.6, 
            color: '#333',
            whiteSpace: 'pre-line',
            fontFamily: 'monospace',
            background: '#f8f9fa',
            padding: '0.8rem',
            borderRadius: 4,
            border: '1px solid #e9ecef'
          }}>
            {JSON.stringify(sectionData, null, 2)}
          </div>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.6, color: '#333' }}>
            {sectionData}
          </div>
        )}
      </div>
    );
  };

  // 다양한 피드백 구조 처리
  if (feedbackData.rawText) {
    // 텍스트 형태의 피드백을 구조화해서 표시
    const lines = feedbackData.rawText.split('\n').filter(line => line.trim());
    let currentSection = null;
    let sections = {};
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // 섹션 헤더 감지 (예: "강점:", "약점:", "추천사항:" 등)
      if (trimmedLine.includes(':') && trimmedLine.length < 50) {
        currentSection = trimmedLine.replace(':', '').trim();
        sections[currentSection] = [];
      } else if (currentSection && trimmedLine) {
        sections[currentSection].push(trimmedLine);
      }
    });

    if (Object.keys(sections).length > 0) {
      return (
        <div>
          {Object.entries(sections).map(([sectionName, items]) => {
            let icon = '📝', color = '#6c757d';
            
            if (sectionName.includes('강점') || sectionName.includes('잘한')) {
              icon = '✅'; color = '#28a745';
            } else if (sectionName.includes('약점') || sectionName.includes('개선') || sectionName.includes('부족')) {
              icon = '⚠️'; color = '#ffc107';
            } else if (sectionName.includes('추천') || sectionName.includes('제안')) {
              icon = '💡'; color = '#17a2b8';
            } else if (sectionName.includes('요약') || sectionName.includes('정리')) {
              icon = '📋'; color = '#6f42c1';
            }
            
            return <div key={sectionName}>{renderFeedbackSection(items, sectionName, icon, color)}</div>;
          })}
        </div>
      );
    } else {
      // 구조화할 수 없는 텍스트는 그대로 표시
      return (
        <div style={{ 
          padding: '1rem', 
          background: '#f8f9fa', 
          borderRadius: 8, 
          fontSize: 14, 
          lineHeight: 1.6,
          whiteSpace: 'pre-line'
        }}>
          {feedbackData.rawText}
        </div>
      );
    }
  }

  // 구조화된 객체 데이터 처리
  return (
    <div>
      {feedbackData.summary && renderFeedbackSection(
        feedbackData.summary, '학습 요약', '📋', '#6f42c1'
      )}
      
      {feedbackData.strengths && renderFeedbackSection(
        feedbackData.strengths, '강점 분야', '✅', '#28a745'
      )}
      
      {feedbackData.weaknesses && renderFeedbackSection(
        feedbackData.weaknesses, '개선 필요 분야', '⚠️', '#ffc107'
      )}
      
      {feedbackData.recommendations && renderFeedbackSection(
        feedbackData.recommendations, '학습 추천사항', '💡', '#17a2b8'
      )}
      
      {feedbackData.nextSteps && renderFeedbackSection(
        feedbackData.nextSteps, '다음 단계', '🚀', '#fd7e14'
      )}
      
      {/* 기타 필드들을 구조화된 형태로 처리 */}
      {Object.entries(feedbackData).map(([key, value]) => {
        if (['summary', 'strengths', 'weaknesses', 'recommendations', 'nextSteps', 'rawText'].includes(key)) {
          return null;
        }
        
        // 기타 필드들도 구조화된 섹션으로 표시 (JSON 객체는 문자열로 변환)
        const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
        return renderFeedbackSection(
          displayValue, 
          key.charAt(0).toUpperCase() + key.slice(1), 
          '📊', 
          '#6c757d'
        );
      })}
    </div>
  );
};

function CategoryReportPage() {
  const { category } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategoryReport = async () => {
      if (!user?.user_id || !category) return;

      try {
        setLoading(true);
        const response = await getCategoryReport(user.user_id, decodeURIComponent(category));
        if (response.success) {
          setReportData(response.data);
        } else {
          setError('보고서를 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('카테고리 보고서 로드 실패:', err);
        setError('보고서 로드에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadCategoryReport();
  }, [user, category]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>보고서를 불러오는 중...</div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 16 }}>{error || '보고서 데이터가 없습니다.'}</div>
          <button 
            onClick={() => navigate(-1)}
            style={{ 
              padding: '0.8rem 1.5rem', 
              borderRadius: 10, 
              border: 'none', 
              fontWeight: 700, 
              cursor: 'pointer', 
              background: 'var(--accent-gradient)', 
              color: '#fff' 
            }}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const { latestReport, categoryProgress, recentHistory } = reportData;
  
  // 디버깅을 위한 콘솔 로그 추가
  console.log('CategoryReportPage - reportData:', reportData);
  console.log('CategoryReportPage - latestReport:', latestReport);
  console.log('CategoryReportPage - latestReport.detailedReport:', latestReport.detailedReport);
  console.log('CategoryReportPage - latestReport.feedback_report:', latestReport.feedback_report);
  
  // 파싱된 보고서 데이터
  const parsedDetailedReport = parseDetailedReport(latestReport.detailedReport);
  const parsedFeedbackReport = parseDetailedReport(latestReport.feedback_report);
  const performanceGrade = getPerformanceGrade(latestReport.score, latestReport.totalQuestions);
  
  console.log('CategoryReportPage - parsedDetailedReport:', parsedDetailedReport);
  console.log('CategoryReportPage - parsedFeedbackReport:', parsedFeedbackReport);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '1rem' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'none', 
              border: '1.5px solid #667eea', 
              borderRadius: 8, 
              padding: '0.4rem 1.2rem', 
              color: '#667eea', 
              fontWeight: 700, 
              cursor: 'pointer',
              marginBottom: 16
            }}
          >
            ← 돌아가기
          </button>
          <h2 style={{ fontWeight: 900, fontSize: 24, marginBottom: 8 }}>
            📊 {reportData.category} 보고서
          </h2>
          <p style={{ color: '#666', marginBottom: 0 }}>
            카테고리별 상세 학습 분석 및 피드백
          </p>
        </div>

        {/* 최신 성과 요약 */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.5rem', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#667eea' }}>🎯 최신 퀴즈 성과</h3>
            <div style={{
              padding: '0.5rem 1rem',
              borderRadius: 20,
              background: performanceGrade.color + '20',
              color: performanceGrade.color,
              fontWeight: 700,
              fontSize: 14
            }}>
              {performanceGrade.grade} ({performanceGrade.label})
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div style={{ 
              padding: '1.2rem', 
              background: `linear-gradient(135deg, ${performanceGrade.color}15, ${performanceGrade.color}05)`, 
              borderRadius: 12, 
              textAlign: 'center',
              border: `2px solid ${performanceGrade.color}30`
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: performanceGrade.color, marginBottom: 4 }}>
                {latestReport.score}/{latestReport.totalQuestions}
              </div>
              <div style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>최근 점수</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                {Math.round((latestReport.score / latestReport.totalQuestions) * 100)}% 정답률
              </div>
            </div>
            
            <div style={{ padding: '1.2rem', background: 'linear-gradient(135deg, #28a74515, #28a74505)', borderRadius: 12, textAlign: 'center', border: '2px solid #28a74530' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#28a745', marginBottom: 4 }}>
                {latestReport.progressPercentage}%
              </div>
              <div style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>학습 진행률</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                목표 대비 달성도
              </div>
            </div>
            
            {categoryProgress && (
              <>
                <div style={{ padding: '1.2rem', background: 'linear-gradient(135deg, #ff980015, #ff980005)', borderRadius: 12, textAlign: 'center', border: '2px solid #ff980030' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#ff9800', marginBottom: 4 }}>
                    {categoryProgress.quizCount}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>총 퀴즈 횟수</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    누적 테스트 완료
                  </div>
                </div>
                
                <div style={{ padding: '1.2rem', background: 'linear-gradient(135deg, #9c27b015, #9c27b005)', borderRadius: 12, textAlign: 'center', border: '2px solid #9c27b030' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#9c27b0', marginBottom: 4 }}>
                    {categoryProgress.averageScore}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>평균 점수</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    전체 평균 성과
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
            마지막 테스트: {new Date(latestReport.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* 심층 학습 분석 보고서 */}
        {(parsedDetailedReport || parsedFeedbackReport) && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.5rem', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#667eea' }}>🔬 심층 학습 분석</h3>
            <div style={{ 
              background: 'linear-gradient(135deg, #f0f8ff, #ffffff)', 
              borderRadius: 12, 
              padding: '1.5rem',
              border: '1px solid #e3f2fd',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
            }}>
              {(() => {
                const reportToRender = parsedDetailedReport || parsedFeedbackReport;
                // 모든 보고서를 구조화된 형태로 표시하기 위해 DetailedReportRenderer만 사용
                return <DetailedReportRenderer reportData={reportToRender} />;
              })()}
            </div>
          </div>
        )}

        {/* 최근 성과 히스토리 */}
        {recentHistory && recentHistory.length > 0 && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#667eea' }}>📈 학습 성과 추이</h3>
            
            <div style={{ overflowX: 'auto', background: 'linear-gradient(135deg, #f8f9fa, #ffffff)', borderRadius: 12, padding: '1rem', border: '1px solid #e9ecef' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #667eea', background: 'linear-gradient(135deg, #667eea10, #667eea05)' }}>
                    <th style={{ padding: '1rem 0.8rem', textAlign: 'left', fontSize: 14, fontWeight: 700, color: '#667eea' }}>📅 테스트 일자</th>
                    <th style={{ padding: '1rem 0.8rem', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#667eea' }}>🎯 점수</th>
                    <th style={{ padding: '1rem 0.8rem', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#667eea' }}>📊 성취도</th>
                    <th style={{ padding: '1rem 0.8rem', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#667eea' }}>🔢 회차</th>
                    <th style={{ padding: '1rem 0.8rem', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#667eea' }}>⭐ 등급</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.map((history, idx) => {
                    const historyGrade = getPerformanceGrade(history.score, 10);
                    const isLatest = idx === 0;
                    return (
                      <tr key={idx} style={{ 
                        borderBottom: '1px solid #f0f0f0',
                        background: isLatest ? 'linear-gradient(135deg, #667eea08, #667eea03)' : 'transparent',
                        fontWeight: isLatest ? 600 : 400
                      }}>
                        <td style={{ padding: '1rem 0.8rem', fontSize: 14, color: isLatest ? '#333' : '#666' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isLatest && <span style={{ color: '#667eea', fontSize: 12 }}>🔥</span>}
                            {new Date(history.created_at).toLocaleDateString('ko-KR', { 
                              month: 'short', 
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 0.8rem', textAlign: 'center', fontSize: 16, fontWeight: 700 }}>
                          <span style={{ 
                            color: historyGrade.color,
                            padding: '0.2rem 0.6rem',
                            borderRadius: 8,
                            background: historyGrade.color + '15'
                          }}>
                            {history.score}/10
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.8rem', textAlign: 'center', fontSize: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <span style={{ 
                              color: historyGrade.color,
                              fontWeight: 600,
                              fontSize: 15
                            }}>
                              {history.progressPercentage}%
                            </span>
                            <div style={{ 
                              width: 40, 
                              height: 6, 
                              background: '#f0f0f0', 
                              borderRadius: 3, 
                              overflow: 'hidden' 
                            }}>
                              <div style={{
                                width: `${history.progressPercentage}%`,
                                height: '100%',
                                background: historyGrade.color,
                                transition: 'width 0.5s ease'
                              }}></div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 0.8rem', textAlign: 'center', fontSize: 14, color: '#666' }}>
                          <span style={{ 
                            padding: '0.2rem 0.5rem',
                            borderRadius: 6,
                            background: '#f8f9fa',
                            color: '#495057',
                            fontSize: 13,
                            fontWeight: 600
                          }}>
                            {history.testCount}회차
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.8rem', textAlign: 'center', fontSize: 14 }}>
                          <span style={{ 
                            padding: '0.3rem 0.6rem',
                            borderRadius: 12,
                            background: historyGrade.color + '20',
                            color: historyGrade.color,
                            fontSize: 12,
                            fontWeight: 700
                          }}>
                            {historyGrade.grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 성과 트렌드 요약 */}
            <div style={{ marginTop: 16, padding: '1rem', background: 'linear-gradient(135deg, #e8f4fd, #f0f8ff)', borderRadius: 8, border: '1px solid #bbdefb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#1565c0', fontWeight: 600 }}>
                  📊 최근 {recentHistory.length}회 평균: {Math.round(recentHistory.reduce((sum, h) => sum + h.score, 0) / recentHistory.length)}점
                </span>
                <span style={{ color: '#666' }}>
                  {recentHistory.length > 1 && (
                    <>
                      {recentHistory[0].score > recentHistory[1].score ? '📈 상승세' : 
                       recentHistory[0].score < recentHistory[1].score ? '📉 하락세' : '➡️ 유지'}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button
            onClick={() => navigate('/category-quiz')}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: 10,
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'var(--accent-gradient)',
              color: '#fff'
            }}
          >
            새 퀴즈 풀기
          </button>
          <button
            onClick={() => navigate('/dashboard/progress')}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: 10,
              border: '1px solid #667eea',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'transparent',
              color: '#667eea'
            }}
          >
            전체 진행률 보기
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryReportPage;