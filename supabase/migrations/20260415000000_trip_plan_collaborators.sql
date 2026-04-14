-- Trip plan collaborators table (mirrors diary_collaborators pattern)
CREATE TABLE trip_plan_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_plan_id uuid NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'removed')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(trip_plan_id, user_id)
);

-- Enable RLS
ALTER TABLE trip_plan_collaborators ENABLE ROW LEVEL SECURITY;

-- Policies for trip_plan_collaborators
CREATE POLICY "Users can view collaborators of their plans" ON trip_plan_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_plans tp
      WHERE tp.id = trip_plan_id AND tp.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own collaboration status" ON trip_plan_collaborators
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Plan owners can insert collaborators" ON trip_plan_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_plans tp
      WHERE tp.id = trip_plan_id AND tp.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own collaboration status" ON trip_plan_collaborators
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Plan owners can remove collaborators" ON trip_plan_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trip_plans tp
      WHERE tp.id = trip_plan_id AND tp.author_id = auth.uid()
    )
  );

-- RPC: invite a collaborator to a trip plan
CREATE OR REPLACE FUNCTION invite_trip_plan_collaborator(p_trip_plan_id uuid, p_username text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_target_user_id uuid;
  v_plan_author_id uuid;
  v_existing_count int;
BEGIN
  -- Get target user by username
  SELECT id INTO v_target_user_id FROM profiles WHERE username = p_username;
  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check plan ownership
  SELECT author_id INTO v_plan_author_id FROM trip_plans WHERE id = p_trip_plan_id;
  IF v_plan_author_id IS NULL THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  IF v_plan_author_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to invite collaborators';
  END IF;

  IF v_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot invite yourself';
  END IF;

  -- Check collaborator limit (max 10)
  SELECT COUNT(*) INTO v_existing_count FROM trip_plan_collaborators
  WHERE trip_plan_id = p_trip_plan_id AND status != 'removed';
  IF v_existing_count >= 10 THEN
    RAISE EXCEPTION 'Max 10 collaborators allowed';
  END IF;

  -- Check if already a collaborator
  IF EXISTS (
    SELECT 1 FROM trip_plan_collaborators
    WHERE trip_plan_id = p_trip_plan_id AND user_id = v_target_user_id AND status != 'removed'
  ) THEN
    RAISE EXCEPTION 'Already a collaborator';
  END IF;

  -- Insert invitation
  INSERT INTO trip_plan_collaborators (trip_plan_id, user_id, invited_by, status)
  VALUES (p_trip_plan_id, v_target_user_id, auth.uid(), 'pending');
END;
$$;

-- RPC: respond to a trip plan invitation
CREATE OR REPLACE FUNCTION respond_trip_plan_invitation(p_collab_id uuid, p_accept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE trip_plan_collaborators
  SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'removed' END,
      responded_at = now()
  WHERE id = p_collab_id AND user_id = auth.uid() AND status = 'pending';
END;
$$;
