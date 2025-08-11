import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import axios from 'axios';

function CategoryManagePage() {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const loadCategoryData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 사용자 카테고리 목록 조회
      const categoryResponse = await axios.get(`/api/user-categories/${user.user_id}`);
      setCategories(categoryResponse.data || ['기본']);
      
      // 진행률 정보에서 카테고리별 통계 조회
      const progressResponse = await axios.get(`/api/progress/${user.user_id}`);
      const categoryProgress = progressResponse.data?.categoryProgress || [];
      
      // 카테고리별 통계 매핑
      const statsMap = {};
      categoryProgress.forEach(cp => {
        statsMap[cp.category] = cp;
      });
      setCategoryStats(statsMap);
      
    } catch (error) {
      console.error('카테고리 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.user_id) {
      loadCategoryData();
    }
  }, [user, loadCategoryData]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      await axios.post(`/api/user-categories/${user.user_id}`, {
        newCategory: newCategory.trim()
      });
      
      setNewCategory('');
      await loadCategoryData();
    } catch (error) {
      console.error('카테고리 추가 실패:', error);
      alert('카테고리 추가에 실패했습니다.');
    }
  };

  const handleEditCategory = async (oldCategory, newCategoryName) => {
    if (!newCategoryName.trim() || oldCategory === newCategoryName.trim()) {
      setEditingCategory(null);
      return;
    }
    
    try {
      await axios.patch(`/api/user-categories/${user.user_id}`, {
        oldCategory,
        newCategory: newCategoryName.trim()
      });
      
      setEditingCategory(null);
      setEditCategoryName('');
      await loadCategoryData();
    } catch (error) {
      console.error('카테고리 수정 실패:', error);
      alert('카테고리 수정에 실패했습니다.');
    }
  };

  const handleDeleteCategory = async (categoryToDelete) => {
    if (categoryToDelete === '기본') {
      alert('기본 카테고리는 삭제할 수 없습니다.');
      return;
    }
    
    if (!window.confirm(`'${categoryToDelete}' 카테고리를 삭제하시겠습니까?\n이 카테고리의 모든 데이터는 '기본' 카테고리로 이동됩니다.`)) {
      return;
    }
    
    try {
      await axios.post(`/api/user-categories/${user.user_id}/delete`, {
        targetCategory: categoryToDelete
      });
      
      await loadCategoryData();
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>카테고리 정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '1rem' }}>
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
          <h2 style={{ fontWeight: 900, fontSize: 24, marginBottom: 8 }}>학습 카테고리 관리</h2>
          <p style={{ color: '#666', marginBottom: 0 }}>학습 카테고리를 추가, 수정, 삭제할 수 있습니다.</p>
        </div>

        {/* 새 카테고리 추가 */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>➕ 새 카테고리 추가</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="예: Mathematics - Calculus"
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                borderRadius: 8,
                border: '1px solid var(--card-border)',
                outline: 'none',
                fontSize: 14
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategory.trim()}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 8,
                border: 'none',
                fontWeight: 700,
                cursor: newCategory.trim() ? 'pointer' : 'not-allowed',
                background: newCategory.trim() ? 'var(--accent-gradient)' : '#ddd',
                color: '#fff',
                fontSize: 14
              }}
            >
              추가
            </button>
          </div>
        </div>

        {/* 기존 카테고리 목록 */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>📚 현재 카테고리</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            {categories.map((category, index) => {
              const stats = categoryStats[category];
              const isEditing = editingCategory === category;
              
              return (
                <div key={index} style={{
                  padding: '1rem',
                  borderRadius: 12,
                  border: '1px solid var(--card-border)',
                  background: '#fafafa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: '1px solid #667eea',
                            outline: 'none',
                            fontSize: 14
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditCategory(category, editCategoryName);
                            } else if (e.key === 'Escape') {
                              setEditingCategory(null);
                              setEditCategoryName('');
                            }
                          }}
                        />
                        <button
                          onClick={() => handleEditCategory(category, editCategoryName)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: 'none',
                            background: '#28a745',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          저장
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(null);
                            setEditCategoryName('');
                          }}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: 'none',
                            background: '#6c757d',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: '#333', margin: 0 }}>{category}</h4>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setEditCategoryName(category);
                            }}
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: 6,
                              border: '1px solid #ffc107',
                              background: 'transparent',
                              color: '#ffc107',
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            수정
                          </button>
                          {category !== '기본' && (
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: 6,
                                border: '1px solid #dc3545',
                                background: 'transparent',
                                color: '#dc3545',
                                cursor: 'pointer',
                                fontSize: 12
                              }}
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {stats && (
                    <>
                      <div style={{ width: '100%', height: 8, background: '#e9ecef', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                        <div style={{
                          width: `${stats.progress}%`,
                          height: '100%',
                          background: stats.progress >= 70 ? '#28a745' : stats.progress >= 50 ? '#ffc107' : '#dc3545',
                          transition: 'width 0.5s ease'
                        }}></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, fontSize: 13 }}>
                        <div>
                          <span style={{ color: '#666' }}>진행률:</span>
                          <span style={{ fontWeight: 600, marginLeft: 4, color: '#333' }}>{stats.progress}%</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>퀴즈:</span>
                          <span style={{ fontWeight: 600, marginLeft: 4, color: '#333' }}>{stats.quizCount}회</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>평균:</span>
                          <span style={{ fontWeight: 600, marginLeft: 4, color: '#333' }}>{stats.averageScore}점</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>최근:</span>
                          <span style={{ fontWeight: 600, marginLeft: 4, color: '#333' }}>
                            {stats.lastQuizDate ? new Date(stats.lastQuizDate).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {!stats && (
                    <div style={{ color: '#666', fontSize: 14, fontStyle: 'italic' }}>
                      아직 학습 데이터가 없습니다.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
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
            카테고리별 퀴즈 풀기
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
            진행률 보기
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryManagePage;
