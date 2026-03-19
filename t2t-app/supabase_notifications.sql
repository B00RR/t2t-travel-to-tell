-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Recipient
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Triggerer
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
    target_id UUID NOT NULL, -- diary_id or follow_id
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 3. Function to handle notification creation
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id UUID;
BEGIN
    -- Determine recipient based on trigger table
    IF TG_TABLE_NAME = 'likes' THEN
        SELECT user_id INTO recipient_id FROM public.diaries WHERE id = NEW.diary_id;
        
        -- Don't notify if the user likes their own diary
        IF recipient_id = NEW.user_id THEN
            RETURN NEW;
        END IF;

        INSERT INTO public.notifications (user_id, actor_id, type, target_id)
        VALUES (recipient_id, NEW.user_id, 'like', NEW.diary_id);

    ELSIF TG_TABLE_NAME = 'comments' THEN
        SELECT user_id INTO recipient_id FROM public.diaries WHERE id = NEW.diary_id;

        -- Don't notify if the user comments on their own diary
        IF recipient_id = NEW.user_id THEN
            RETURN NEW;
        END IF;

        INSERT INTO public.notifications (user_id, actor_id, type, target_id)
        VALUES (recipient_id, NEW.user_id, 'comment', NEW.diary_id);

    ELSIF TG_TABLE_NAME = 'follows' THEN
        recipient_id := NEW.following_id;

        INSERT INTO public.notifications (user_id, actor_id, type, target_id)
        VALUES (recipient_id, NEW.follower_id, 'follow', NEW.following_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Triggers
DROP TRIGGER IF EXISTS on_like_notification ON public.likes;
CREATE TRIGGER on_like_notification
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();

DROP TRIGGER IF EXISTS on_comment_notification ON public.comments;
CREATE TRIGGER on_comment_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();

DROP TRIGGER IF EXISTS on_follow_notification ON public.follows;
CREATE TRIGGER on_follow_notification
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();
