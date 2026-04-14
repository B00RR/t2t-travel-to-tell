export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export type ActionTable = 
  | 'day_entries' 
  | 'comments' 
  | 'trip_plans'
  | 'trip_plan_stops'
  | 'trip_plan_checklist_items'
  | 'likes'
  | 'saves';

export interface OfflineAction {
  id: string;
  type: ActionType;
  table: ActionTable;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
}

export interface QueueState {
  actions: OfflineAction[];
  isProcessing: boolean;
  lastProcessedId: string | null;
}
