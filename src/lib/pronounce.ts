const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en/"

const audioUrlCache = new Map<string, string | null>()
const audioElementCache = new Map<string, HTMLAudioElement>()

function normalizeAudioUrl(url: string): string {
  if (url.startsWith("//")) {
    return `https:${url}`
  }
  if (!/^https?:/i.test(url)) {
    return url
  }
  return url
}

async function fetchAudioUrl(word: string): Promise<string | null> {
  const response = await fetch(`${API_BASE}${encodeURIComponent(word)}`)
  if (!response.ok) {
    throw new Error(`Dictionary API 요청 실패 (status: ${response.status})`)
  }

  const payload = await response.json()
  if (!Array.isArray(payload)) {
    return null
  }

  for (const entry of payload) {
    if (!entry || typeof entry !== "object") {
      continue
    }
    const phonetics = Array.isArray(entry.phonetics) ? entry.phonetics : []
    for (const phonetic of phonetics) {
      if (!phonetic || typeof phonetic !== "object") {
        continue
      }
      const rawAudio = typeof phonetic.audio === "string" ? phonetic.audio.trim() : ""
      if (rawAudio) {
        return normalizeAudioUrl(rawAudio)
      }
    }
  }

  return null
}

export async function playPronunciation(word: string): Promise<void> {
  if (typeof window === "undefined" || typeof Audio === "undefined") {
    throw new Error("현재 환경에서는 오디오 재생을 지원하지 않습니다.")
  }

  const normalized = word.trim()
  if (!normalized) {
    return
  }

  let audioUrl = audioUrlCache.get(normalized) ?? null
  if (!audioUrlCache.has(normalized)) {
    audioUrl = await fetchAudioUrl(normalized)
    audioUrlCache.set(normalized, audioUrl ?? null)
  }

  if (!audioUrl) {
    throw new Error(`"${normalized}" 단어에 대한 오디오를 찾을 수 없습니다.`)
  }

  let audio = audioElementCache.get(normalized) ?? null
  if (!audio) {
    audio = new Audio(audioUrl)
    audio.preload = "auto"
    audio.crossOrigin = "anonymous"
    audioElementCache.set(normalized, audio)
  } else if (audio.src !== audioUrl) {
    audio.src = audioUrl
  }

  audio.pause()
  audio.currentTime = 0

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio?.removeEventListener("ended", handleEnded)
      audio?.removeEventListener("error", handleError)
    }

    const handleEnded = () => {
      cleanup()
      resolve()
    }

    const handleError = () => {
      cleanup()
      reject(new Error("오디오 재생에 실패했습니다."))
    }

    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    const playPromise = audio.play()
    if (playPromise) {
      playPromise.catch((error) => {
        cleanup()
        reject(error instanceof Error ? error : new Error(String(error)))
      })
    }
  })
}

