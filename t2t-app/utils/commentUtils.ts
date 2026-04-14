import type { Comment } from '@/types/social';

export interface CommentThread {
  comment: Comment;
  replies: CommentThread[];
  replyCount: number;
}

export function buildCommentTree(comments: Comment[]): CommentThread[] {
  const commentMap = new Map<string, CommentThread>();
  const rootThreads: CommentThread[] = [];

  comments.forEach(comment => {
    commentMap.set(comment.id, { comment, replies: [], replyCount: 0 });
  });

  comments.forEach(comment => {
    const thread = commentMap.get(comment.id)!;
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      const parent = commentMap.get(comment.parent_id)!;
      parent.replies.push(thread);
      parent.replyCount++;
    } else {
      rootThreads.push(thread);
    }
  });

  const sortReplies = (threads: CommentThread[]) => {
    threads.sort((a, b) => new Date(a.comment.created_at).getTime() - new Date(b.comment.created_at).getTime());
    threads.forEach(t => sortReplies(t.replies));
  };

  sortReplies(rootThreads);

  return rootThreads;
}
