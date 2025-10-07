import { FC } from "react"
import type { GameSummary, DayStat } from "../types"

type GameModalsProps = {
  // Summary 모달
  summary: GameSummary | null
  onCloseSummary: () => void
  onRestartFromSummary: () => void
  
  // Completion 모달
  showCompletionModal: boolean
  currentStat: DayStat
  onCloseCompletion: () => void
  onBeginReview: () => void
  onRetryFromCompletion: () => void
  
  // Review Choice 모달
  showReviewChoiceModal: boolean
  onFinalizeReview: (keepWrongSet: boolean) => void
}

const GameModals: FC<GameModalsProps> = ({
  summary,
  onCloseSummary,
  onRestartFromSummary,
  showCompletionModal,
  currentStat,
  onCloseCompletion,
  onBeginReview,
  onRetryFromCompletion,
  showReviewChoiceModal,
  onFinalizeReview,
}) => {
  return (
    <>
      {/* 1. Summary 모달 (타이머 모드 종료 시) */}
      {summary && (
        <div className="game__overlay">
          <div className="game__summary">
            <h2>결과 요약</h2>
            <p>점수: {summary.score}</p>
            <p>정확도: {Math.round(summary.accuracy)}%</p>
            <p>최대 스트릭: {summary.maxStreak}</p>
            <div className="game__summary-actions">
              <button 
                type="button" 
                onClick={onCloseSummary} 
                className="game__summary-button"
              >
                닫기
              </button>
              <button 
                type="button" 
                onClick={onRestartFromSummary} 
                className="game__summary-button game__summary-button--primary"
              >
                다시 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Completion 모달 (Day 완료 시) */}
      {showCompletionModal && (
        <div className="game__overlay">
          <div className="game__summary">
            <h2>🎉 오늘의 연습 완료</h2>
            <p>오늘의 연습을 끝냈습니다!</p>
            {currentStat.wrongSet.length > 0 ? (
              <p style={{ color: "#ef4444", marginTop: "0.5rem" }}>
                틀린 단어 {currentStat.wrongSet.length}개를 복습하시겠습니까?
              </p>
            ) : (
              <p style={{ color: "#10b981", marginTop: "0.5rem" }}>
                모든 단어를 완벽하게 학습했습니다! 🎉
              </p>
            )}
            <div className="game__summary-actions">
              <button 
                type="button" 
                onClick={onCloseCompletion} 
                className="game__summary-button"
              >
                나중에
              </button>
              <button
                type="button"
                onClick={onRetryFromCompletion}
                className="game__summary-button"
              >
                다시하기
              </button>
              {currentStat.wrongSet.length > 0 && (
                <button
                  type="button"
                  onClick={onBeginReview}
                  className="game__summary-button game__summary-button--primary"
                >
                  복습하기 ({currentStat.wrongSet.length}개)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Review Choice 모달 (복습 완료 시) */}
      {showReviewChoiceModal && (
        <div className="game__overlay">
          <div className="game__summary">
            <h2>✅ 복습 완료!</h2>
            <p>틀린 단어 목록(wrongSet)을 어떻게 하시겠습니까?</p>
            <div style={{ 
              marginTop: "1rem", 
              padding: "1rem", 
              background: "#f3f4f6", 
              borderRadius: "8px",
              fontSize: "0.9rem",
              textAlign: "left"
            }}>
              <p><strong>비우기:</strong> 복습한 단어들을 목록에서 제거합니다.</p>
              <p style={{ marginTop: "0.5rem" }}>
                <strong>유지하기:</strong> 다음에도 같은 단어들을 다시 복습할 수 있습니다.
              </p>
            </div>
            <div className="game__summary-actions">
              <button
                type="button"
                onClick={() => onFinalizeReview(false)}
                className="game__summary-button game__summary-button--primary"
              >
                비우기 (권장)
              </button>
              <button
                type="button"
                onClick={() => onFinalizeReview(true)}
                className="game__summary-button"
              >
                유지하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GameModals