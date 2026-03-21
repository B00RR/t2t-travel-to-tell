export type TripPlanVisibility = 'public' | 'private' | 'friends';
export type ChecklistCategory = 'documents' | 'gear' | 'accommodation' | 'transport' | 'general';

export interface TripPlan {
  id: string;
  author_id: string;
  source_diary_id: string | null;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  destinations: string[];
  start_date: string | null;
  end_date: string | null;
  visibility: TripPlanVisibility;
  budget_estimate: BudgetEstimate;
  clone_count: number;
  created_at: string;
  updated_at: string;
  // joined relations
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  stops?: TripPlanStop[];
  checklist?: ChecklistItem[];
}

export interface TripPlanStop {
  id: string;
  trip_plan_id: string;
  day_number: number;
  title: string | null;
  location_name: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  trip_plan_id: string;
  category: ChecklistCategory;
  label: string;
  is_checked: boolean;
  sort_order: number;
}

export interface BudgetExpense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
}

export interface BudgetEstimate {
  total?: number;
  currency?: string;
  breakdown?: Record<string, number>;
  expenses?: BudgetExpense[];
}
