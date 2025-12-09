export interface AutodartsSegment {
    name: string;
    number: number;
    bed: string;
    multiplier: number;
}

export interface AutodartsThrow {
    segment: AutodartsSegment;
    coords: { x: number; y: number };
}

export interface AutodartsState {
    connected: boolean;
    running: boolean;
    status: string;
    event: string;
    numThrows: number;
    throws: AutodartsThrow[];
}
