export interface RoverStatus {
  roverId: string;
  ts: string;
  position: { x: number; y: number; z: number; heading: number };
  battery: { percent: number; etaMinutes: number; voltage: number };
  mixture: { liters: number; capacity: number };
  water: { liters: number; capacity: number };
  state: string;
  runtimeMinutes: number;
}

const liveState = new Map<string, RoverStatus>();

export function updateLiveSnapshot(roverId: string, status: RoverStatus) {
  liveState.set(roverId, status);
}

export function getLiveSnapshot(roverId: string): RoverStatus | undefined {
  return liveState.get(roverId);
}

export function getAllLiveSnapshots(): RoverStatus[] {
  return Array.from(liveState.values());
}
