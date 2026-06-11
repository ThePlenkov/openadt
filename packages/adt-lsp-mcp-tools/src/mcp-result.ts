export function toMcpJson(result: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  }
}

export function toMcpText(text: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text,
      },
    ],
  }
}

export function toMcpError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error: ${message}`,
      },
    ],
    isError: true as const,
  }
}
