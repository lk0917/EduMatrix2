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

const parseFeedbackReport = (feedbackReport) => {
  if (!feedbackReport) return null;
  
  try {
    // 문자열인 경우 JSON 파싱 시도
    if (typeof feedbackReport === 'string') {
      if (feedbackReport.trim().startsWith('{') || feedbackReport.trim().startsWith('[')) {
        try {
          return JSON.parse(feedbackReport);
        } catch (e) {
          return { rawText: feedbackReport };
        }
      }
      return { rawText: feedbackReport };
    }
    
    return feedbackReport;
  } catch (error) {
    console.error('피드백 보고서 파싱 실패:', error);
    return { rawText: String(feedbackReport) };
  }
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

// 접기/펼치기 상태를 관리하는 컴포넌트들
const CollapsibleArray = ({ value, itemKey, level = 0 }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const indent = level * 20;

  const toggle = React.useCallback(() => setIsOpen(!isOpen), [isOpen]);

  return (
    <div style={{ marginLeft: indent }}>
      {itemKey && (
        <div 
          style={{ 
            fontWeight: 600, 
            color: '#495057', 
            marginBottom: 8,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            padding: '0.3rem 0',
            borderRadius: 4,
            transition: 'background 0.2s ease'
          }}
          onClick={toggle}
          onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <span style={{ fontSize: 12, color: '#667eea' }}>
            {isOpen ? '📖' : '📋'}
          </span>
          {itemKey} ({value.length}개 항목)
          <span style={{ fontSize: 12, color: '#6c757d', marginLeft: 'auto' }}>
            {isOpen ? '▼' : '▶'}
          </span>
        </div>
      )}
      {isOpen && (
        <div style={{ 
          background: 'linear-gradient(135deg, #f8f9fa, #ffffff)', 
          borderRadius: 8, 
          padding: '1rem',
          border: '1px solid #e9ecef',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {value.map((item, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 10, 
              marginBottom: idx < value.length - 1 ? 12 : 0,
              padding: '0.6rem',
              background: idx % 2 === 0 ? '#ffffff' : '#f8f9fa',
              borderRadius: 6,
              border: '1px solid #f1f3f4'
            }}>
              <span style={{ 
                color: '#667eea', 
                fontWeight: 700, 
                minWidth: 24,
                fontSize: 12,
                background: '#667eea20',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {idx + 1}
              </span>
              <div style={{ flex: 1, fontSize: 14, lineHeight: 1.5 }}>
                <JsonValueRenderer value={item} level={level + 1} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CollapsibleObject = ({ value, itemKey, level = 0 }) => {
  const [isOpen, setIsOpen] = React.useState(level < 2);
  const indent = level * 20;
  const objectKeys = Object.keys(value);

  const toggle = React.useCallback(() => setIsOpen(!isOpen), [isOpen]);

  return (
    <div style={{ marginLeft: indent }}>
      {itemKey && (
        <div 
          style={{ 
            fontWeight: 600, 
            color: '#495057', 
            marginBottom: 8,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            padding: '0.4rem 0.6rem',
            borderRadius: 6,
            transition: 'all 0.2s ease',
            background: 'transparent'
          }}
          onClick={toggle}
          onMouseEnter={(e) => {
            e.target.style.background = '#667eea10';
            e.target.style.transform = 'translateX(2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateX(0)';
          }}
        >
          <span style={{ fontSize: 12, color: '#667eea' }}>
            {isOpen ? '📂' : '📁'}
          </span>
          {itemKey} ({objectKeys.length}개 속성)
          <span style={{ fontSize: 12, color: '#6c757d', marginLeft: 'auto' }}>
            {isOpen ? '▼' : '▶'}
          </span>
        </div>
      )}
      {isOpen && (
        <div style={{ 
          background: level === 0 ? 'linear-gradient(135deg, #ffffff, #f8f9fa)' : 
                     level === 1 ? 'linear-gradient(135deg, #f8f9fa, #ffffff)' : '#f1f3f4',
          borderRadius: 8,
          padding: '1rem',
          border: `1px solid ${level === 0 ? '#e9ecef' : '#dee2e6'}`,
          marginBottom: 12,
          boxShadow: level === 0 ? '0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {Object.entries(value).map(([subKey, subValue], idx) => (
            <div key={subKey} style={{ 
              marginBottom: idx < objectKeys.length - 1 ? 16 : 0,
              padding: level > 0 ? '0.5rem' : '0',
              background: level > 0 && idx % 2 === 0 ? '#ffffff' : 'transparent',
              borderRadius: level > 0 ? 4 : 0,
              border: level > 0 ? '1px solid #f1f3f4' : 'none'
            }}>
              <JsonValueRenderer value={subValue} itemKey={subKey} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 개별 값 렌더링 컴포넌트
const JsonValueRenderer = ({ value, itemKey = '', level = 0 }) => {
  const indent = level * 20;

  if (Array.isArray(value)) {
    return <CollapsibleArray value={value} itemKey={itemKey} level={level} />;
  }

  if (typeof value === 'object' && value !== null) {
    return <CollapsibleObject value={value} itemKey={itemKey} level={level} />;
  }

  // 기본 값 렌더링
  return (
    <div style={{ 
      marginLeft: indent,
      marginBottom: 8,
      padding: '0.4rem 0.6rem',
      borderRadius: 4,
      background: level > 1 ? '#ffffff' : 'transparent',
      border: level > 1 ? '1px solid #f1f3f4' : 'none'
    }}>
      {itemKey && (
        <div style={{ 
          fontWeight: 600, 
          color: '#495057',
          fontSize: 13,
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <span style={{ color: '#667eea', fontSize: 10 }}>🔹</span>
          {itemKey}
        </div>
      )}
      <div style={{ 
        fontSize: 14, 
        lineHeight: 1.6,
        color: '#333',
        padding: itemKey ? '0.3rem 0.6rem' : '0',
        background: itemKey ? '#f8f9fa' : 'transparent',
        borderRadius: itemKey ? 4 : 0,
        border: itemKey ? '1px solid #e9ecef' : 'none',
        fontFamily: typeof value === 'number' ? 'monospace' : 'inherit',
        fontWeight: typeof value === 'number' ? 600 : 400
      }}>
        {String(value)}
      </div>
    </div>
  );
};

// JSON 데이터를 구조화된 UI 컴포넌트로 변환
const JsonDataRenderer = ({ data, title, icon }) => {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      {title && (
        <h4 style={{ 
          fontSize: 16, 
          fontWeight: 700, 
          marginBottom: 12, 
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {icon} {title}
        </h4>
      )}
      <JsonValueRenderer value={data} />
    </div>
  );
};

// 특별한 피드백 섹션 렌더러
const FeedbackSectionRenderer = ({ feedbackData }) => {
  if (!feedbackData) return null;

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
                {typeof item === 'object' ? <JsonDataRenderer data={item} /> : item}
              </li>
            ))}
          </ul>
        ) : typeof sectionData === 'object' ? (
          <JsonDataRenderer data={sectionData} />
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
      
      {/* 기타 필드들 처리 */}
      {Object.entries(feedbackData).map(([key, value]) => {
        if (['summary', 'strengths', 'weaknesses', 'recommendations', 'nextSteps', 'rawText'].includes(key)) {
          return null;
        }
        
        return (
          <div key={key}>
            <JsonDataRenderer 
              data={value} 
              title={key.charAt(0).toUpperCase() + key.slice(1)} 
              icon="📊"
            />
          </div>
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
  
  // 파싱된 보고서 데이터
  const parsedDetailedReport = parseDetailedReport(latestReport.detailedReport);
  const parsedFeedbackReport = parseFeedbackReport(latestReport.feedback_report);
  const performanceGrade = getPerformanceGrade(latestReport.score, latestReport.totalQuestions);

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

        {/* 상세 피드백 보고서 */}
        {parsedFeedbackReport && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.5rem', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#667eea' }}>🤖 AI 맞춤 피드백</h3>
            <div style={{ 
              background: 'linear-gradient(135deg, #f8f9fa, #ffffff)', 
              borderRadius: 12, 
              padding: '1.5rem', 
              lineHeight: 1.7,
              border: '1px solid #e9ecef',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
            }}>
              <FeedbackSectionRenderer feedbackData={parsedFeedbackReport} />
            </div>
          </div>
        )}

        {/* 상세 분석 보고서 */}
        {parsedDetailedReport && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.5rem', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#667eea' }}>🔬 심층 학습 분석</h3>
            <div style={{ 
              background: 'linear-gradient(135deg, #f0f8ff, #ffffff)', 
              borderRadius: 12, 
              padding: '1.5rem',
              border: '1px solid #e3f2fd',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
            }}>
              {parsedDetailedReport.rawText ? (
                <FeedbackSectionRenderer feedbackData={parsedDetailedReport} />
              ) : (
                <div>
                  <JsonDataRenderer 
                    data={parsedDetailedReport} 
                    title="" 
                    icon=""
                  />
                </div>
              )}
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