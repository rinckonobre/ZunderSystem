type TimeUnit = "seconds" | "minutes" | "hours" | "days" | "months"

export class Cooldown {
    private readonly endDate: Date;

    constructor(value: number, unit: TimeUnit = "seconds") {
        const timeMultiplier = this.getTimeMultiplier(unit);
        const endTime = new Date(Date.now() + value * timeMultiplier);
        this.endDate = endTime;
    }
    private getTimeMultiplier(unit: TimeUnit): number {
        switch (unit) {
          case "seconds":
            return 1000;
          case "minutes":
            return 1000 * 60;
          case "hours":
            return 1000 * 60 * 60;
          case "days":
            return 1000 * 60 * 60 * 24;
          case "months":
            return 1000 * 60 * 60 * 24 * 30;
          default:
            throw new Error(`Invalid unit: ${unit}`);
        }
    }
    get isExpired(): boolean {
        return this.endDate.getTime() < Date.now();
    }
    
    get timeLeft(): number {
        return this.endDate.getTime() - Date.now();
    }
    get endTime(): number {
        return this.endDate.getTime();
    }
}

// type TimeUnit = "seconds" | "minutes" | "hours" | "days" | "months";

// class Cooldowns {
//   private readonly _endTime: Date;

//   constructor(value: number, unit: TimeUnit = "seconds") {
//     const timeMultiplier = this.getTimeMultiplier(unit);
//     const endTime = new Date(Date.now() + value * timeMultiplier);
//     this._endTime = endTime;
//   }

//   private getTimeMultiplier(unit: TimeUnit): number {
//     switch (unit) {
//       case "seconds":
//         return 1000;
//       case "minutes":
//         return 1000 * 60;
//       case "hours":
//         return 1000 * 60 * 60;
//       case "days":
//         return 1000 * 60 * 60 * 24;
//       case "months":
//         return 1000 * 60 * 60 * 24 * 30; // 30 days per month (approx.)
//       default:
//         throw new Error(`Invalid unit: ${unit}`);
//     }
//   }

//   get isExpired(): boolean {
//     return this._endTime.getTime() < Date.now();
//   }

//   get timeLeft(): number {
//     return this._endTime.getTime() - Date.now();
//   }
// }