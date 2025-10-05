export type SpeakOptions = {
  lang?: string
  rate?: number
  pitch?: number
  voiceHint?: string
}

const speech = typeof window !== "undefined" && window.speechSynthesis ? window.speechSynthesis : null

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!speech) {
    return Promise.resolve([])
  }

  if (voicesPromise) {
    return voicesPromise
  }

  const existing = speech.getVoices()
  if (existing.length > 0) {
    voicesPromise = Promise.resolve(existing)
    return voicesPromise
  }

  voicesPromise = new Promise((resolve) => {
    const handleVoicesChanged = () => {
      speech.removeEventListener("voiceschanged", handleVoicesChanged)
      resolve(speech.getVoices())
    }

    speech.addEventListener("voiceschanged", handleVoicesChanged)
    // 일부 브라우저에서는 speak 호출 이후에만 voiceschanged 이벤트가 발생하므로
    // 안전하게 한 번 더 호출한다.
    setTimeout(() => {
      const voices = speech.getVoices()
      if (voices.length > 0) {
        speech.removeEventListener("voiceschanged", handleVoicesChanged)
        resolve(voices)
      }
    }, 500)
  })

  return voicesPromise
}

function selectVoice(
  voices: SpeechSynthesisVoice[],
  { lang, voiceHint }: Pick<SpeakOptions, "lang" | "voiceHint">
): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null
  }

  const hint = voiceHint?.toLowerCase()
  if (hint) {
    const hintedVoice = voices.find((voice) =>
      [voice.name, voice.voiceURI].some((value) =>
        value?.toLowerCase().includes(hint)
      )
    )
    if (hintedVoice) {
      return hintedVoice
    }
  }

  if (lang) {
    const normalizedLang = lang.toLowerCase()
    const exactMatch = voices.find((voice) => voice.lang?.toLowerCase() === normalizedLang)
    if (exactMatch) {
      return exactMatch
    }

    const partialMatch = voices.find((voice) =>
      voice.lang?.toLowerCase().startsWith(normalizedLang.split("-")[0] ?? normalizedLang)
    )
    if (partialMatch) {
      return partialMatch
    }
  }

  return voices[0] ?? null
}

export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (!speech) {
    throw new Error("Web Speech API를 지원하지 않는 환경입니다.")
  }

  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return
  }

  const utterance = new SpeechSynthesisUtterance(trimmed)
  const voices = await loadVoices()
  const selectedVoice = selectVoice(voices, options)

  if (options.lang ?? selectedVoice?.lang) {
    utterance.lang = (options.lang ?? selectedVoice?.lang) as string
  }
  if (typeof options.rate === "number") {
    utterance.rate = options.rate
  }
  if (typeof options.pitch === "number") {
    utterance.pitch = options.pitch
  }
  if (selectedVoice) {
    utterance.voice = selectedVoice
  }

  speech.cancel() // iOS 자동재생 이슈 방지: 기존 큐를 모두 정리

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      utterance.removeEventListener("end", handleEnd)
      utterance.removeEventListener("error", handleError)
    }

    const handleEnd = () => {
      cleanup()
      resolve()
    }

    const handleError = (event: SpeechSynthesisErrorEvent) => {
      cleanup()
      reject(event.error ? new Error(event.error) : new Error("Speech synthesis failed"))
    }

    utterance.addEventListener("end", handleEnd)
    utterance.addEventListener("error", handleError)
    speech.speak(utterance)
  })
}

