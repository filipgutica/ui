const channels = (color: string): [number, number, number] => {
  const value = color.length === 4
    ? [...color.slice(1)].map(channel => channel.repeat(2)).join('')
    : color.slice(1, 7)
  return [0, 2, 4].map(offset => Number.parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number]
}

export const contrast = (foreground: string, background: string): number => {
  const luminance = (color: string): number => {
    const [red, green, blue] = channels(color).map(channel => {
      const normalized = channel / 255
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!
  }
  const foregroundLuminance = luminance(foreground)
  const backgroundLuminance = luminance(background)
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
}

export const mix = (foreground: string, background: string, foregroundRatio: number): string => {
  const foregroundChannels = channels(foreground)
  const backgroundChannels = channels(background)
  const mixed = foregroundChannels.map((channel, index) => Math.round(
    channel * foregroundRatio + backgroundChannels[index]! * (1 - foregroundRatio),
  ))
  return `#${mixed.map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}
