-- Create materialized view for learning aid statistics
-- This aggregates rating, comment, reaction, and save counts in a single view
-- to avoid N+1 query problems when loading the feed

CREATE OR REPLACE VIEW learning_aid_stats AS
SELECT
  la.id AS aid_id,

  -- Rating stats
  COALESCE(AVG(r.stars), 0) AS rating_avg,
  COUNT(DISTINCT r.id) AS rating_count,

  -- Comment count
  COUNT(DISTINCT c.id) AS comment_count,

  -- Reaction count
  COUNT(DISTINCT rx.id) AS reaction_count,

  -- Save count (from study sets) - use composite key
  COUNT(DISTINCT (ssi.set_id, ssi.aid_id)) AS save_count

FROM learning_aids la
LEFT JOIN ratings r ON r.aid_id = la.id
LEFT JOIN comments c ON c.aid_id = la.id
LEFT JOIN reactions rx ON rx.aid_id = la.id
LEFT JOIN study_set_items ssi ON ssi.aid_id = la.id
GROUP BY la.id;

-- Create index on aid_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_learning_aid_stats_aid_id
ON learning_aids(id);

-- Add helpful comment
COMMENT ON VIEW learning_aid_stats IS
'Aggregated statistics for learning aids. Join this view to avoid N+1 queries when fetching stats for multiple aids.';
