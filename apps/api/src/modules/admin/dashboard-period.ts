import { BadRequestException } from "@nestjs/common";

const DAY = 86400000;
export function dashboardPeriod(from?: string, to?: string, now = new Date()) {
  const today = new Date(now.getTime() + 4 * 3600000).toISOString().slice(0, 10);
  const endDay = to ?? today;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(endDay) ||
    !Number.isFinite(Date.parse(`${endDay}T00:00:00+04:00`))
  )
    throw new BadRequestException("Invalid calendar date.");
  const startDay =
    from ??
    new Date(Date.parse(`${endDay}T00:00:00+04:00`) - 29 * DAY + 4 * 3600000)
      .toISOString()
      .slice(0, 10);
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
      throw new BadRequestException("Use YYYY-MM-DD dates.");
    const date = new Date(`${value}T00:00:00+04:00`);
    if (
      !Number.isFinite(date.getTime()) ||
      new Date(date.getTime() + 4 * 3600000).toISOString().slice(0, 10) !== value
    )
      throw new BadRequestException("Invalid calendar date.");
    return date;
  };
  const start = parse(startDay);
  const end = new Date(parse(endDay).getTime() + DAY);
  const days = (end.getTime() - start.getTime()) / DAY;
  if (days < 1 || days > 1096)
    throw new BadRequestException("Select between 1 and 1096 days.");
  return {
    from: startDay,
    to: endDay,
    start,
    end,
    previousStart: new Date(start.getTime() - days * DAY),
    previousEnd: start,
    days,
    interval: days > 90 ? "month" : "day",
    timezone: "Asia/Dubai",
  };
}
export function comparison(current: number, previous: number) {
  return {
    value: current,
    previous,
    change: current - previous,
    percent: previous === 0 ? null : ((current - previous) / previous) * 100,
  };
}
