-- Trip plans table
CREATE TABLE trip_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_diary_id uuid REFERENCES diaries(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  cover_image_url text,
  destinations text[] DEFAULT '{}',
  start_date date,
  end_date date,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'friends')),
  budget_estimate jsonb DEFAULT '{}',
  clone_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trip plan stops (one per day/tappa)
CREATE TABLE trip_plan_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_plan_id uuid NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  title text,
  location_name text,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trip plan checklist items
CREATE TABLE trip_plan_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_plan_id uuid NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('documents', 'gear', 'accommodation', 'transport', 'general')),
  label text NOT NULL,
  is_checked boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE trip_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_plan_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_plan_checklist_items ENABLE ROW LEVEL SECURITY;

-- trip_plans policies
CREATE POLICY "Users can view public trip plans" ON trip_plans
  FOR SELECT USING (visibility = 'public' OR author_id = auth.uid());

CREATE POLICY "Users can insert own trip plans" ON trip_plans
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own trip plans" ON trip_plans
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete own trip plans" ON trip_plans
  FOR DELETE USING (author_id = auth.uid());

-- trip_plan_stops policies
CREATE POLICY "Access stops of visible plans" ON trip_plan_stops
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_plans tp
      WHERE tp.id = trip_plan_id
        AND (tp.visibility = 'public' OR tp.author_id = auth.uid())
    )
  );

CREATE POLICY "Manage own plan stops" ON trip_plan_stops
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trip_plans tp
      WHERE tp.id = trip_plan_id AND tp.author_id = auth.uid()
    )
  );

-- trip_plan_checklist_items policies
CREATE POLICY "Access checklist of visible plans" ON trip_plan_checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_plans tp
      WHERE tp.id = trip_plan_id
        AND (tp.visibility = 'public' OR tp.author_id = auth.uid())
    )
  );

CREATE POLICY "Manage own plan checklist" ON trip_plan_checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trip_plans tp
      WHERE tp.id = trip_plan_id AND tp.author_id = auth.uid()
    )
  );

-- RPC: clone a trip plan (copies stops + checklist, resets is_checked)
CREATE OR REPLACE FUNCTION clone_trip_plan(source_plan_id uuid, new_author_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_plan_id uuid;
  stop_rec RECORD;
  item_rec RECORD;
BEGIN
  INSERT INTO trip_plans (
    author_id, source_diary_id, title, description, cover_image_url,
    destinations, start_date, end_date, visibility, budget_estimate
  )
  SELECT
    new_author_id, source_diary_id, title || ' (copy)', description, cover_image_url,
    destinations, start_date, end_date, 'private', budget_estimate
  FROM trip_plans
  WHERE id = source_plan_id AND visibility = 'public'
  RETURNING id INTO new_plan_id;

  IF new_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan not found or not public';
  END IF;

  FOR stop_rec IN
    SELECT * FROM trip_plan_stops WHERE trip_plan_id = source_plan_id ORDER BY sort_order
  LOOP
    INSERT INTO trip_plan_stops (trip_plan_id, day_number, title, location_name, notes, sort_order)
    VALUES (new_plan_id, stop_rec.day_number, stop_rec.title, stop_rec.location_name, stop_rec.notes, stop_rec.sort_order);
  END LOOP;

  FOR item_rec IN
    SELECT * FROM trip_plan_checklist_items WHERE trip_plan_id = source_plan_id ORDER BY sort_order
  LOOP
    INSERT INTO trip_plan_checklist_items (trip_plan_id, category, label, is_checked, sort_order)
    VALUES (new_plan_id, item_rec.category, item_rec.label, false, item_rec.sort_order);
  END LOOP;

  UPDATE trip_plans SET clone_count = clone_count + 1 WHERE id = source_plan_id;

  RETURN new_plan_id;
END;
$$;
