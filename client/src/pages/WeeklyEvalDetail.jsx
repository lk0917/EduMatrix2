import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getWeeklyQuizProgress, getUserQuizStats } from '../services/quizService';
import axios from 'axios';

function WeeklyEvalDetail() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [serverNarrative, setServerNarrative] = useState("");
  const [serverReportParsed, setServerReportParsed] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);

  // 카테고리별 통계를 가져오는 함수
  const fetchCategoryStats = async (userId) => {
    try {
      const response = await axios.get(`/api/progress/${userId}`);
      return response.data?.categoryProgress || [];
    } catch (error) {
      console.error('카테고리 통계 조회 실패:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchWeeklyData = async () => {
      if (!user?.user_id) return;
      
      try {
        setLoading(true);
        const [progressData, statsData, categoryData] = await Promise.all([
          getWeeklyQuizProgress(user.user_id),
          getUserQuizStats(user.user_id),
          fetchCategoryStats(user.user_id)
        ]);
        
        if (categoryData) {
          setCategoryStats(categoryData);
        }

        if (progressData?.success && statsData?.success) {
          setWeeklyData({
            progress: progressData.progress,
            stats: statsData.stats,
            recentQuizzes: progressData.recentQuizzes || []
          });

          // 서버에서 저장한 최신 보고서(narrativeReport) 사용 시도
          const rawReport = progressData?.progress?.narrativeReport;
          if (typeof rawReport === 'string' && rawReport.trim().length > 0) {
            let raw = rawReport.trim();
            // 코드 펜스 제거
            if (raw.includes('```')) raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            // JSON 추출 시도
            try {
              const first = raw.indexOf('{');
              const last = raw.lastIndexOf('}');
              if (first !== -1 && last !== -1 && last > first) {
                const candidate = raw.substring(first, last + 1);
                const parsed = JSON.parse(candidate);
                if (parsed && parsed.score && parsed.progress) {
                  setServerReportParsed(parsed);
                  setReport({
                    score: {
                      raw: parsed.score.raw,
                      total: parsed.score.total,
                      percent: parsed.score.percent,
                    },
                    progress: {
                      currentProgressPercent: parsed.progress.currentProgressPercent,
                      confidence: parsed.progress.confidence || (
                        (progressData?.recentQuizzes?.length || 0) >= 5
                          ? 'high'
                          : (progressData?.recentQuizzes?.length || 0) >= 3
                          ? 'medium'
                          : 'low'
                      ),
                    },
                    analysis: {
                      strengths: Array.isArray(parsed?.patterns?.strengths)
                        ? parsed.patterns.strengths
                        : [],
                      weaknesses: Array.isArray(parsed?.patterns?.weaknesses)
                        ? parsed.patterns.weaknesses
                        : [],
                      recommendations: Array.isArray(parsed?.actionPlan?.next7Days)
                        ? parsed.actionPlan.next7Days.map((d) => `${d.focus}`)
                        : [],
                    },
                  });
                  // narrative는 별도 텍스트로 추출 (있다면)
                  const afterJson = raw.substring(last + 1).trim();
                  setServerNarrative(afterJson || '');
                } else {
                  // JSON이 아니면 내러티브 텍스트로만 표시
                  setServerNarrative(raw);
                }
              } else {
                // JSON 경계가 없으면 내러티브 텍스트로만 표시
                setServerNarrative(raw);
              }
            } catch (_e) {
              // 파싱 실패 시, 원문을 내러티브로 사용
              setServerNarrative(raw);
            }
          }
        }
      } catch (error) {
        console.error('주간 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [user]);

  const generateReport = () => {
    if (report) return; // 서버 보고서가 이미 있으면 재생성하지 않음
    if (!weeklyData?.recentQuizzes?.length) return;

    const latestQuiz = weeklyData.recentQuizzes[0];
    const score = latestQuiz.score || 0;
    const totalQuestions = latestQuiz.problems?.length || 10;
    const progress = latestQuiz.progressPercentage || 0;

    const reportData = {
      score: {
        raw: score,
        total: totalQuestions,
        percent: Math.round((score / totalQuestions) * 100),
      },
      progress: {
        currentProgressPercent: progress,
        confidence:
          weeklyData.recentQuizzes.length >= 5
            ? 'high'
            : weeklyData.recentQuizzes.length >= 3
            ? 'medium'
            : 'low',
      },
      analysis: {
        strengths:
          score >= totalQuestions * 0.8
            ? ['기본 개념 이해 우수', '학습 목표 달성 중']
            : ['꾸준한 학습 의지'],
        weaknesses:
          score < totalQuestions * 0.6
            ? ['기본 개념 복습 필요', '응용력 향상 필요']
            : ['일부 영역 보완 필요'],
        recommendations:
          score >= totalQuestions * 0.8
            ? ['심화 학습 진행', '실전 문제 풀이', '고급 내용 탐구']
            : score >= totalQuestions * 0.6
            ? ['틀린 문제 복습', '기본 개념 정리', '실습 문제 풀이']
            : ['기본 개념 재학습', '단계별 접근', '꾸준한 복습'],
      },
      nextSteps: {
        immediate: ['틀린 문제 오답 노트 작성', '약점 영역 집중 학습'],
        weekly: ['일일 학습 계획 수립', '주간 목표 설정'],
        monthly: ['월간 성과 점검', '학습 방법 개선'],
      },
    };

    setReport(reportData);
  };

  // 파생: 다음 단계 표시용 안전한 데이터 구성
  const nextStepsToShow = (() => {
    if (report?.nextSteps) return report.nextSteps;
    if (serverReportParsed?.actionPlan) {
      const focuses = Array.isArray(serverReportParsed.actionPlan.next7Days)
        ? serverReportParsed.actionPlan.next7Days.map((d) => d?.focus).filter(Boolean)
        : [];
      return {
        immediate: ['틀린 문제 오답 노트 작성', '약점 영역 집중 학습'],
        weekly: focuses.length > 0 ? focuses.slice(0, 4) : ['일일 학습 계획 수립', '주간 목표 설정'],
      };
    }
    return {
      immediate: ['틀린 문제 오답 노트 작성', '약점 영역 집중 학습'],
      weekly: ['일일 학습 계획 수립', '주간 목표 설정'],
    };
  })();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>주간 평가 데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'none', 
              border: '1.5px solid #667eea', 
              borderRadius: 8, 
              padding: '0.4rem 1.2rem', 
              color: '#667eea', 
              fontWeight: 700, 
              cursor: 'pointer' 
            }}
          >
            ← 돌아가기
          </button>
          <h2 style={{ fontWeight: 900, fontSize: 28, color: '#667eea', margin: 0 }}>주간 최종 평가</h2>
        </div>

        {/* 주간 퀴즈 통계 */}
        {weeklyData && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.5rem', marginBottom: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#667eea' }}>📊 주간 퀴즈 통계</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#e3fcec', borderRadius: 12 }}>
                <div style={{ fontSize: 14, color: '#2e7d32', marginBottom: 4 }}>총 퀴즈 횟수</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#2e7d32' }}>
                  {weeklyData.stats?.total_quiz_count || 0}회
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#fff3cd', borderRadius: 12 }}>
                <div style={{ fontSize: 14, color: '#856404', marginBottom: 4 }}>평균 점수</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#856404' }}>
                  {weeklyData.stats?.average_quiz_score || 0}점
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#ffeaea', borderRadius: 12 }}>
                <div style={{ fontSize: 14, color: '#c62828', marginBottom: 4 }}>최고 점수</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#c62828' }}>
                  {weeklyData.stats?.best_quiz_score || 0}점
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#e8f4fd', borderRadius: 12 }}>
                <div style={{ fontSize: 14, color: '#1976d2', marginBottom: 4 }}>학습 진행률</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1976d2' }}>
                  {weeklyData.progress?.weeklyQuizProgress || 0}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 최근 퀴즈 결과 */}
        {weeklyData?.recentQuizzes?.length > 0 && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.5rem', marginBottom: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#667eea' }}>📝 최근 퀴즈 결과</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {weeklyData.recentQuizzes.slice(0, 3).map((quiz, index) => (
                <div key={index} style={{ 
                  padding: '1rem', 
                  background: '#f8f9fa', 
                  borderRadius: 10, 
                  border: '1px solid #e9ecef' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: '#333' }}>
                      {quiz.testCount}회차 퀴즈
                    </span>
                    <span style={{ fontSize: 14, color: '#666' }}>
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 14, color: '#666' }}>점수: </span>
                      <span style={{ fontWeight: 600, color: '#333' }}>
                        {quiz.score || 0} / {quiz.problems?.length || 10}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 14, color: '#666' }}>정답률: </span>
                      <span style={{ fontWeight: 600, color: '#333' }}>
                        {Math.round(((quiz.score || 0) / (quiz.problems?.length || 10)) * 100)}%
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 14, color: '#666' }}>틀린 문제: </span>
                      <span style={{ fontWeight: 600, color: '#333' }}>
                        {quiz.wrong?.length || 0}개
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 보고서 생성 버튼: 서버 보고서 없을 때만 표시 */}
        {weeklyData?.recentQuizzes?.length > 0 && !report && !serverNarrative && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.5rem', marginBottom: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#667eea' }}>📋 상세 학습 보고서</h3>
            <p style={{ marginBottom: 16, color: '#666' }}>
              최근 퀴즈 결과를 바탕으로 개인화된 학습 보고서를 생성합니다.
            </p>
            <button 
              onClick={generateReport}
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
              보고서 생성하기
            </button>
          </div>
        )}

        {/* 서버/로컬 보고서 표시 */}
        {(report || serverNarrative) && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.5rem', marginBottom: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#667eea' }}>📋 개인화 학습 보고서</h3>
            {report && (
              <>
                {/* 점수 요약 */}
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#333' }}>점수 요약</h4>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 14, color: '#666' }}>최근 점수: </span>
                      <span style={{ fontWeight: 600, color: '#333' }}>
                        {report.score.raw} / {report.score.total} ({report.score.percent}%)
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 14, color: '#666' }}>신뢰도: </span>
                      <span style={{ fontWeight: 600, color: '#333' }}>
                        {report.progress.confidence === 'high' ? '높음' : report.progress.confidence === 'medium' ? '보통' : '낮음'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 강점과 약점 */}
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#333' }}>강점과 약점</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ padding: '1rem', background: '#e3fcec', borderRadius: 10 }}>
                      <h5 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#2e7d32' }}>✅ 강점</h5>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 14, color: '#2e7d32' }}>
                        {report.analysis.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ padding: '1rem', background: '#ffeaea', borderRadius: 10 }}>
                      <h5 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#c62828' }}>❌ 개선점</h5>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 14, color: '#c62828' }}>
                        {report.analysis.weaknesses.map((weakness, index) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 추천 학습 방향 */}
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#333' }}>추천 학습 방향</h4>
                  <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: 10 }}>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 14, color: '#856404' }}>
                      {report.analysis.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* 다음 단계 */}
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#333' }}>다음 단계</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                <div style={{ padding: '1rem', background: '#e8f4fd', borderRadius: 10 }}>
                  <h5 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1976d2' }}>즉시 실행</h5>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 14, color: '#1976d2' }}>
                    {nextStepsToShow.immediate.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ padding: '1rem', background: '#f3e5f5', borderRadius: 10 }}>
                  <h5 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#7b1fa2' }}>주간 계획</h5>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 14, color: '#7b1fa2' }}>
                    {nextStepsToShow.weekly.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 카테고리별 학습 분석 */}
            {categoryStats.length > 0 && (
              <div style={{ marginTop: 24, marginBottom: 24 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#333' }}>📚 카테고리별 학습 분석</h4>
                <div style={{ display: 'grid', gap: 16 }}>
                  {categoryStats.map((categoryData, index) => (
                    <div key={index} style={{ 
                      padding: '1rem', 
                      borderRadius: 12, 
                      border: '1px solid #e0e0e0', 
                      background: '#fafafa' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h5 style={{ fontSize: 15, fontWeight: 700, color: '#333', margin: 0 }}>{categoryData.category}</h5>
                        <div style={{ 
                          fontSize: 16, 
                          fontWeight: 700, 
                          color: categoryData.progress >= 70 ? '#28a745' : categoryData.progress >= 50 ? '#ffc107' : '#dc3545',
                          background: categoryData.progress >= 70 ? '#d4edda' : categoryData.progress >= 50 ? '#fff3cd' : '#f8d7da',
                          padding: '4px 8px',
                          borderRadius: 6
                        }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, fontSize: 13 }}>
                        <div>
                          <span style={{ color: '#666' }}>퀴즈 횟수:</span>
                          <span style={{ fontWeight: 600, marginLeft: 4, color: '#333' }}>{categoryData.quizCount}회</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>평균 점수:</span>
                          <span style={{ fontWeight: 600, marginLeft: 4, color: '#333' }}>{categoryData.averageScore}점</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>최근 퀴즈:</span>
                          <span style={{ fontWeight: 600, marginLeft: 4, color: '#333' }}>
                            {categoryData.lastQuizDate 
                              ? new Date(categoryData.lastQuizDate).toLocaleDateString()
                              : '-'
                            }
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>학습 상태:</span>
                          <span style={{ 
                            fontWeight: 600, 
                            marginLeft: 4,
                            color: categoryData.progress >= 70 ? '#28a745' : categoryData.progress >= 50 ? '#f57c00' : '#dc3545'
                          }}>
                            {categoryData.progress >= 70 ? '우수' : categoryData.progress >= 50 ? '보통' : '개선필요'}
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
          </div>
        )}
        {/* 주간 최종 평가는 통계/보고서 확인 전용으로 유지 */}
      </div>
    </div>
  );
}

export default WeeklyEvalDetail; 