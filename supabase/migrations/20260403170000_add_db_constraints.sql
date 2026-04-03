-- Audit logging table: tracks all data-changing operations on core tables
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,              -- who did it (auth.uid())
  action text NOT NULL,                -- INSERT, UPDATE, DELETE
  table_name text NOT NULL,            -- which table
  record_id uuid,                      -- target record
  old_data jsonb,                      -- previous state (for UPDATE/DELETE)
  new_data jsonb,                      — new state (for INSERT/UPDATE)
  ip_address text,                     -- not available via triggers, placeholder
  user_agent text,                     -- not available via triggers, placeholder
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only admins (service_role) can read, no user can write
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are immutable" ON public.audit_logs
  FOR ALL USING (false);

-- ── Trigger Functions ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- ── Attach triggers to core tables ────────────────────────

-- DIARIES: most sensitive content
CREATE TRIGGER _audit_diaries
  AFTER INSERT OR UPDATE OR DELETE ON public.diaries
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- COMMENTS: social moderation
CREATE TRIGGER _audit_comments
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- FOLLOWS: social graph manipulation
CREATE TRIGGER _audit_follows
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- LIKES: engagement manipulation
CREATE TRIGGER _audit_likes
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- PROFILES: user identity
CREATE TRIGGER _audit_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- INDEX for fast queries
CREATE INDEX audit_logs_actor_idx ON public.audit_logs (actor_id);
CREATE INDEX audit_logs_table_idx ON public.audit_logs (table_name);
CREATE INDEX audit_logs_created_idx ON public.audit_logs (created_at DESC);
