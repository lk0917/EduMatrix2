import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getWeeklyQuizProgress } from '../services/quizService';
import { marked } from 'marked';

function ProgressDetail() {
  const [progress, setProgress] = useState(null);
  const [weeklyInfo, setWeeklyInfo] = useState(null);
  const [reportText, setReportText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchAll = async () => {
    // user_id 추출: edumatrix_user 우선, 없으면 개별 키 사용
    let user_id = null;
    try {
      const stored = localStorage.getItem('edumatrix_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        user_id = parsed?.user_id ?? parsed?.id ?? null;
      }
    } catch (_) {}
    if (!user_id) {
      user_id = localStorage.getItem('user_id');
    }
    if (!user_id) return;
    try {
      const [progressRes, weeklyRes] = await Promise.all([
        api.get(`/progress/${user_id}`).catch(() => null),
        getWeeklyQuizProgress(user_id).catch(() => null)
      ]);

      if (progressRes && progressRes.data) {
        setProgress(progressRes.data);
      } else {
        setProgress({
          total: 0,
          last_week: null,
          expected_date: '-',
          subject_stats: [],
          strong: '-',
          weak: '-',
        });
      }

      if (weeklyRes?.success) {
        setWeeklyInfo(weeklyRes);
      } else {
        setWeeklyInfo({ success: false, recentQuizzes: [], progress: { weeklyQuizProgress: 0 } });
      }
    } catch (e) {
      setProgress({
        total: 0,
        last_week: null,
        expected_date: '-',
        subject_stats: [],
        strong: '-',
        weak: '-',
      });
      setWeeklyInfo({ success: false, recentQuizzes: [], progress: { weeklyQuizProgress: 0 } });
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // 주기적 최신 데이터 반영 (30초마다 새로고침)
  useEffect(() => {
    const id = setInterval(() => {
      fetchAll();
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const handleManualRefresh = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      await fetchAll();
    } finally {
      setRefreshing(false);
    }
  };

  // 최근 퀴즈 기반 문장형 보고서 빌더 (서버 제공 보고서 우선)
  useEffect(() => {
    // 서버에서 narrativeReport가 오면 우선 사용
    if (weeklyInfo?.progress?.narrativeReport) {
      const raw = weeklyInfo.progress.narrativeReport || '';
      // JSON이 함께 섞여 저장된 과거 데이터 방어: 보고서 시작 지점부터 사용
      const marker = '📘 **개인화 피드백 보고서**';
      const startIdx = raw.indexOf(marker);
      const cleaned = startIdx >= 0 ? raw.slice(startIdx) : raw.replace(/```json[\s\S]*?```/g, '').replace(/\{[\s\S]*\}/, '');
      setReportText(cleaned.trim());
      return;
    }

    if (!weeklyInfo?.recentQuizzes?.length) return;

    const recent = weeklyInfo.recentQuizzes;
    const latest = recent[0];
    const prevProgress = (recent[1]?.progressPercentage ?? weeklyInfo?.progress?.weeklyQuizProgress ?? 0) || 0;
    const score = latest?.score || 0;
    const testCount = Number(latest?.testCount || 1);
    const totalQuestions = testCount >= 5 ? 20 : (latest?.problems?.length || 10);
    const instantProgress = (score / totalQuestions) * 100;
    const alpha = 0.2 + 0.1 * Math.min(testCount, 5);
    const currentProgress = Math.round(alpha * instantProgress + (1 - alpha) * prevProgress);
    const confidence = testCount <= 2 ? 'low' : testCount <= 4 ? 'medium' : 'high';

    // 예상 완료일 계산
    const remainingPercent = Math.max(0, 90 - currentProgress);
    const recentDelta = Math.max(1, currentProgress - prevProgress);
    const estimatedDays = Math.ceil((remainingPercent / recentDelta) * 2);
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + estimatedDays);
    const estDateStr = estDate.toISOString().slice(0,10);

    const goal = latest?.goal || '학습 목표가 설정되지 않았습니다.';
    const wrong = Array.isArray(latest?.wrong) ? latest.wrong : [];

    const strengths = score >= totalQuestions * 0.8 ? ['기본 개념 이해 우수', '학습 목표 달성 중'] : ['꾸준한 학습 의지'];
    const weaknesses = score < totalQuestions * 0.6 ? ['기본 개념 복습 필요', '응용력 향상 필요'] : ['일부 영역 보완 필요'];
    const systemicRisks = wrong.length > totalQuestions * 0.4 ? ['전체적인 이해도 부족'] : ['특정 영역 집중 학습 필요'];

    const next7Days = [
      { day: 1, focus: '틀린 문제 복습', time: '30분' },
      { day: 2, focus: '기본 개념 정리', time: '45분' },
      { day: 3, focus: '실습 문제 풀이', time: '60분' },
      { day: 4, focus: '심화 학습', time: '45분' },
      { day: 5, focus: '종합 복습', time: '60분' },
      { day: 6, focus: '모의 테스트', time: '90분' },
      { day: 7, focus: '다음 주 계획 수립', time: '30분' },
    ];

    const text = [
      '📘 **개인화 피드백 보고서**',
      '',
      `- **목표**: ${goal}`,
      `- **테스트 유형/회차**: ${testCount >= 5 ? '최종 테스트' : '정기 테스트'} / ${testCount}회차 (${new Date().toISOString().slice(0,10)})`,
      `- **이번 점수**: ${score} / ${totalQuestions} (${Math.round((score/totalQuestions)*100)}%)`,
      '',
      '✅ **전체 학습 진행도**',
      `- 현재 진행도: ${currentProgress}% (이전 ${prevProgress}% → Δ ${currentProgress - prevProgress}%p)`,
      `- 완료 예상일: ${estDateStr}`,
      `- 신뢰도: ${confidence}`,
      `- 산정 근거: α=${alpha.toFixed(1)} × ${Math.round(instantProgress)}% + (1-${alpha.toFixed(1)}) × ${prevProgress}%`,
      '',
      '🧭 **주제별 숙련도**',
      `- 기본 개념: ${Math.min(100, Math.round((score/totalQuestions)*120))}%`,
      `- 응용 문제: ${Math.min(100, Math.round((score/totalQuestions)*100))}%`,
      `- 심화 내용: ${Math.min(100, Math.round((score/totalQuestions)*80))}%`,
      '',
      '❌ **틀린 문제 분석**',
      `틀린 문제 ${wrong.length}개에 대해 개념 이해 부족이 확인되었습니다. 해당 영역 복습이 필요합니다.`,
      '',
      '📊 **패턴 요약**',
      `- 강점: ${strengths.join(', ')}`,
      `- 약점: ${weaknesses.join(', ')}`,
      `- 리스크: ${systemicRisks.join(', ')}`,
      '',
      '🗓️ **7일 학습 계획**',
      ...next7Days.map(d => `Day ${d.day}: ${d.focus} (${d.time})`),
      '',
      '🎯 **마이크로 목표**',
      '일일 학습 목표 달성, 주간 복습 완료, 월간 성과 점검',
      '',
      '📚 **추천 자료**',
      '학습 노트, 추천 자료, 온라인 강의',
      '',
      '🧪 **맞춤 실습 세트**',
      `${Math.max(5, totalQuestions - score)}문제 (${score >= totalQuestions*0.8 ? '고급' : '중급'} 난이도, 객관식 + 주관식)`,
      '',
      '🏁 **목표 진행률**',
      `현재 ${currentProgress}%, 다음 체크포인트: ${Math.min(100, currentProgress + 10)}%`,
      '',
      '🧭 **다음 테스트 계획**',
      '7일 후 추천, 틀린 문제 영역 집중',
      '',
      '🪞 **자기 성찰**',
      '- 질문: 이번 주 학습에서 가장 어려웠던 부분은 무엇인가요?',
      '- 습관 팁: 매일 30분씩 꾸준히 학습하는 습관을 만들어보세요.',
      '',
      '🏅 **획득 배지**',
      `${score/totalQuestions >= 0.9 ? '우수 학습자, 꾸준함의 달인' : score/totalQuestions >= 0.7 ? '성실한 학습자, 도전 정신' : '학습 의지, 개선 의지'}`,
    ].join('\n');

    setReportText(text);
  }, [weeklyInfo, progress]);

  // 서버/퀴즈 데이터가 전혀 없어도 템플릿이 보이도록 최종 폴백
  useEffect(() => {
    if (reportText) return;
    const today = new Date().toISOString().slice(0, 10);
    const current = typeof progress?.total === 'number' ? progress.total : 0;
    const prev = typeof progress?.last_week === 'number' ? progress.last_week : 0;
    const delta = current - (prev || 0);
    const estDate = progress?.expected_date || '-';

    const fallback = [
      '📘 **개인화 피드백 보고서**',
      '',
      '- **목표**: -',
      `- **테스트 유형/회차**: - / -회차 (${today})`,
      '- **이번 점수**: - / - (-%)',
      '',
      '✅ **전체 학습 진행도**',
      `- 현재 진행도: ${current}% (이전 ${prev || 0}% → Δ ${delta}%p)`,
      `- 완료 예상일: ${estDate}`,
      '- 신뢰도: -',
      '- 산정 근거: -',
      '',
      '🧭 **주제별 숙련도**',
      '요약 준비 중',
      '',
      '❌ **틀린 문제 분석**',
      '요약 준비 중',
      '',
      '📊 **패턴 요약**',
      '- 강점: -',
      '- 약점: -',
      '- 리스크: -',
      '',
      '🗓️ **7일 학습 계획**',
      '요약 준비 중',
      '',
      '🎯 **마이크로 목표**',
      '요약 준비 중',
      '',
      '📚 **추천 자료**',
      '요약 준비 중',
      '',
      '🧪 **맞춤 실습 세트**',
      '요약 준비 중',
      '',
      '🏁 **목표 진행률**',
      `현재 ${current}%`,
      '',
      '🧭 **다음 테스트 계획**',
      '요약 준비 중',
      '',
      '🪞 **자기 성찰**',
      '- 질문: -',
      '- 습관 팁: -',
      '',
      '🏅 **획득 배지**',
      '요약 준비 중',
    ].join('\n');

    setReportText(fallback);
  }, [progress, reportText]);

  const reportHtml = useMemo(() => {
    try {
      if (!reportText) return '';
      return marked.parse(reportText);
    } catch (_) {
      return '';
    }
  }, [reportText]);

  if (!progress) return <div>불러오는 중...</div>;

  return (
    <div style={{ maxWidth: 700, margin: '3rem auto', background: 'var(--card-bg)', borderRadius: 22, boxShadow: '0 8px 32px var(--card-shadow)', border: '1.5px solid var(--card-border)', padding: '2.5rem 2.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1.5px solid #667eea', borderRadius: 8, padding: '0.4rem 1.2rem', color: '#667eea', fontWeight: 700, cursor: 'pointer' }}>← 돌아가기</button>
        <h2 style={{ fontWeight: 900, fontSize: 24, color: '#667eea', margin: 0 }}>학습 진행률 상세</h2>
        <button onClick={handleManualRefresh} disabled={refreshing} style={{ background: refreshing ? '#ccc' : 'none', border: '1.5px solid #667eea', borderRadius: 8, padding: '0.4rem 1.2rem', color: refreshing ? '#666' : '#667eea', fontWeight: 700, cursor: refreshing ? 'not-allowed' : 'pointer' }}>{refreshing ? '새로고침 중...' : '↻ 새로고침'}</button>
      </div>
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 18 }}>주간/분야별 상세 진행률</div>
      {/* 전체 진행률 */}
      <div style={{ marginBottom: 18, fontSize: 16 }}>
        전체 달성률: <b style={{ color: '#667eea', fontSize: 20 }}>{progress.total}%</b>
    {typeof progress.last_week === 'number' ? (
    <span style={{ color: '#4caf50', fontWeight: 700, fontSize: 15, marginLeft: 10 }}>
    ({progress.total - progress.last_week >= 0 ? '+' : ''}{progress.total - progress.last_week}% ↑)
    </span>) : (
    <span style={{ color: '#888', fontSize: 14, marginLeft: 10 }}>
    (지난주 데이터 없음)
    </span>
    )} 
     </div>
      {/* 분야별 진행률 바 */}
      {(progress?.subject_stats ?? []).map(item => {
        const trend = Array.isArray(item.trend) ? item.trend : [];
        const color = item.color || '#667eea';
        return (
        <div key={item.name} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: color, fontSize: 15, marginBottom: 2 }}>{item.name}: {item.percent}%</div>
          <div style={{ width: '100%', height: 12, background: '#f0f0f0', borderRadius: 7, margin: '4px 0' }}>
            <div style={{ width: `${item.percent}%`, height: '100%', background: color, borderRadius: 7, transition: 'width 0.4s' }} />
          </div>
          {/* 트렌드 라인 차트 (SVG) */}
          <svg width="100%" height="38" viewBox="0 0 120 38" style={{ marginTop: 2 }}>
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="3"
              points={trend.map((v, i) => `${i * 30},${38 - (v / 100) * 38}`).join(' ')}
            />
            {trend.map((v, i) => (
              <circle key={i} cx={i * 30} cy={38 - (v / 100) * 38} r="3.5" fill={color} />
            ))}
          </svg>
        </div>
        );
      })}
      {/* 목표 대비, 예상 달성일 */}
      <div style={{ margin: '18px 0', fontSize: 15, color: '#888' }}>
        목표 대비 실제 학습량: <b>{
          typeof progress.total === 'number'
            ? `${progress.total}%`
            : `${weeklyInfo?.progress?.weeklyQuizProgress ?? 0}%`
        }</b> / 예상 달성일: <b>{progress.expected_date}</b>
      </div>
      {/* 강점/약점 분석 */}
      <div style={{ margin: '18px 0', fontSize: 15 }}>
        <span style={{ color: '#4caf50', fontWeight: 700 }}>강점</span>: {progress.strong} / <span style={{ color: '#e74c3c', fontWeight: 700 }}>약점</span>: {progress.weak}
      </div>
      {/* 추천 학습 */}
      <div style={{ margin: '18px 0', fontSize: 15, color: '#1976d2', fontWeight: 700 }}>
        추천 학습: {
          (() => {
            const recs = [];
            const latestWrong = Array.isArray(weeklyInfo?.recentQuizzes?.[0]?.wrong)
              ? weeklyInfo.recentQuizzes[0].wrong.length
              : 0;
            if (progress?.weak) recs.push(`${progress.weak} 집중 복습`);
            const low = (progress?.subject_stats || []).slice().sort((a,b)=>a.percent-b.percent)[0];
            if (low) recs.push(`${low.name} 보완 학습`);
            if (latestWrong > 0) recs.push(`오답 ${latestWrong}개 복습`);
            return recs.length ? recs.join(', ') : '맞춤 추천 준비 중';
          })()
        }
      </div>

      {/* 카테고리별 진행률 */}
      {progress?.categoryProgress && progress.categoryProgress.length > 0 && (
        <div style={{ marginTop: 22, marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: '#667eea' }}>📚 카테고리별 학습 진행률</div>
          <div style={{ display: 'grid', gap: 16 }}>
            {progress.categoryProgress.map((categoryData, index) => (
              <div key={index} style={{ 
                padding: '1rem', 
                borderRadius: 12, 
                border: '1px solid var(--card-border)', 
                background: '#fafafa' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>{categoryData.category}</h4>
                  <div style={{ fontSize: 18, fontWeight: 700, color: categoryData.progress >= 70 ? '#28a745' : categoryData.progress >= 50 ? '#ffc107' : '#dc3545' }}>
                    {categoryData.progress}%
                  </div>
                </div>
                <div style={{ width: '100%', height: 8, background: '#e9ecef', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ 
                    width: `${categoryData.progress}%`, 
                    height: '100%', 
                    background: categoryData.progress >= 70 ? '#28a745' : categoryData.progress >= 50 ? '#ffc107' : '#dc3545',
                    transition: 'width 0.5s ease' 
                  }}></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, fontSize: 14 }}>
                  <div>
                    <span style={{ color: '#888' }}>퀴즈:</span>
                    <span style={{ fontWeight: 600, marginLeft: 4 }}>{categoryData.quizCount}회</span>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>평균:</span>
                    <span style={{ fontWeight: 600, marginLeft: 4 }}>{categoryData.averageScore}점</span>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>최근:</span>
                    <span style={{ fontWeight: 600, marginLeft: 4 }}>
                      {categoryData.lastQuizDate 
                        ? new Date(categoryData.lastQuizDate).toLocaleDateString()
                        : '-'
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button 
              onClick={() => navigate('/category-quiz')}
              style={{ 
                padding: '0.6rem 1.2rem', 
                borderRadius: 8, 
                border: 'none', 
                fontWeight: 700, 
                cursor: 'pointer', 
                background: 'var(--accent-gradient)', 
                color: '#fff',
                fontSize: 14
              }}
            >
              카테고리별 퀴즈 풀기
            </button>
          </div>
        </div>
      )}

      {/* 문장형 보고서 */}
      {reportText && (
        <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid var(--card-border)' }}>
          <div style={{ lineHeight: 2.5, color: '#333', fontSize: 18 }} dangerouslySetInnerHTML={{ __html: reportHtml }} />
        </div>
      )}
    </div>
  );
}

export default ProgressDetail; 