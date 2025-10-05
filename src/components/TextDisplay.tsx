import type { FC } from "react"

type TextDisplayProps = {
  target: string
  typed: string
}

const TextDisplay: FC<TextDisplayProps> = ({ target, typed }) => {
  const extra = typed.slice(target.length)

  return (
    <div className="text-display" aria-label="target word">
      {target.split("").map((char, index) => {
        const typedChar = typed[index]
        let status: "pending" | "match" | "mismatch" = "pending"

        if (typedChar != null) {
          status = typedChar === char ? "match" : "mismatch"
        }

        return (
          <span
            key={`${char}-${index}`}
            className={`text-display__char text-display__char--${status}`}
          >
            {char}
          </span>
        )
      })}
      {extra.split("").map((char, index) => (
        <span
          key={`extra-${index}`}
          className="text-display__char text-display__char--extra"
        >
          {char}
        </span>
      ))}
    </div>
  )
}

export default TextDisplay

