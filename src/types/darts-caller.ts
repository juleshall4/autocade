export interface DartsCallerGameData {
    mode: string;
    dartNumber: string;
    dartValue: string;
    fieldName: string;
    fieldNumber: number | string;
    fieldMultiplier: number;
    type: string;
    coords?: { x: number; y: number };
}

export interface DartsCallerEvent {
    event: string;
    game?: DartsCallerGameData;
    [key: string]: any;
}

export interface DartsCallerLogEntry extends DartsCallerEvent {
    _timestamp: string;
}
