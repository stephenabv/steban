/** Time source, injectable so tests can fix "today". */
export abstract class Clock {
  abstract now(): Date;

  /** Today's calendar date in `timeZone` as `YYYY-MM-DD`. */
  today(timeZone: string): string {
    // en-CA formats dates as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(this.now());
  }
}

export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
