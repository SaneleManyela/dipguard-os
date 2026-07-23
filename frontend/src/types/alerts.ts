export type PriorityLevel = 'P1' | 'P2' | 'P3';
export type ThesisState = 'INTACT' | 'UNCERTAIN' | 'BROKEN';
export type CrashMode = 'NORMAL' | 'CORRECTION' | 'BEAR' | 'PANIC';

export interface OpportunityAlert {
    ticker: string;
    classification: string;
    priority: PriorityLevel;
    thesisState: ThesisState;
    reboundProbability: number;
    crashMode: CrashMode;
    econophysicsScore: number;
}
