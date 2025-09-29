const mongoose = require('mongoose');
const ProgressSummary = require('../models/ProgressSummary');
require('dotenv').config();

async function cleanupProgressSummaryData() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 연결 성공');

    console.log("ProgressSummary 데이터 정리 시작...");
    
    const allProgressSummaries = await ProgressSummary.find({});
    console.log(`총 ${allProgressSummaries.length}개의 ProgressSummary 문서 발견`);
    
    let cleanedCount = 0;
    
    for (const summary of allProgressSummaries) {
      let needsUpdate = false;
      
      // categoryProgress 배열 정리
      if (summary.categoryProgress && Array.isArray(summary.categoryProgress)) {
        const originalLength = summary.categoryProgress.length;
        summary.categoryProgress = summary.categoryProgress.filter(cp => {
          if (!cp || typeof cp !== 'object') return false;
          if (!cp.category || typeof cp.category !== 'string') return false;
          if (!cp.category.trim()) return false;
          if (!cp.hasOwnProperty('progress')) return false;
          if (!cp.hasOwnProperty('quizCount')) return false;
          if (!cp.hasOwnProperty('averageScore')) return false;
          return true;
        });
        
        if (summary.categoryProgress.length !== originalLength) {
          needsUpdate = true;
          console.log(`사용자 ${summary.user_id}: categoryProgress 정리 ${originalLength} → ${summary.categoryProgress.length}`);
        }
      } else {
        summary.categoryProgress = [];
        needsUpdate = true;
        console.log(`사용자 ${summary.user_id}: categoryProgress 초기화`);
      }
      
      // subject_stats 배열 정리
      if (summary.subject_stats && Array.isArray(summary.subject_stats)) {
        const originalLength = summary.subject_stats.length;
        summary.subject_stats = summary.subject_stats.filter(ss => {
          if (!ss || typeof ss !== 'object') return false;
          if (!ss.name || typeof ss.name !== 'string') return false;
          if (!ss.name.trim()) return false;
          if (!ss.hasOwnProperty('percent')) return false;
          return true;
        });
        
        if (summary.subject_stats.length !== originalLength) {
          needsUpdate = true;
          console.log(`사용자 ${summary.user_id}: subject_stats 정리 ${originalLength} → ${summary.subject_stats.length}`);
        }
      } else {
        summary.subject_stats = [{
          name: "기본",
          percent: summary.total || 0,
          color: "#667eea",
          trend: [summary.total || 0]
        }];
        needsUpdate = true;
        console.log(`사용자 ${summary.user_id}: subject_stats 초기화`);
      }
      
      if (needsUpdate) {
        await summary.save();
        cleanedCount++;
      }
    }
    
    console.log(`ProgressSummary 데이터 정리 완료: ${cleanedCount}개 문서 업데이트됨`);
    
    // 연결 종료
    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
    
  } catch (error) {
    console.error("ProgressSummary 데이터 정리 실패:", error);
    await mongoose.connection.close();
  }
}

// 스크립트 실행
cleanupProgressSummaryData();
