// hooks/useSpeech.ts
import { useCallback, useEffect, useRef } from 'react'

export function useSpeech() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis API를 지원하지 않는 브라우저입니다.')
      return
    }

    // 이전 타임아웃 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 이전 발음 즉시 취소
    window.speechSynthesis.cancel()
    
    // ✅ 약간의 지연을 두고 재생
    timeoutRef.current = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.95
      utterance.volume = 1.0
      
      window.speechSynthesis.speak(utterance)
    }, 10)
    
  }, [])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  return { speak, cancel }
}