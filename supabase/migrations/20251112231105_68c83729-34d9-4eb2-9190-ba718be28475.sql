-- Add section field to budget_lines for grouping cost codes
ALTER TABLE budget_lines
  ADD COLUMN section text;

-- Add continuation sheet tracking columns to draw_lines
ALTER TABLE draw_lines
  ADD COLUMN prior_to_date numeric DEFAULT 0,
  ADD COLUMN to_date_after numeric DEFAULT 0;

-- Add file upload support for draws (invoices already has file_url)
ALTER TABLE draws
  ADD COLUMN file_url text;

-- Create continuation sheet view for draw calculations
CREATE OR REPLACE VIEW v_draw_continuation AS
SELECT
  d.id as draw_id,
  d.package_id,
  bl.id as budget_line_id,
  bl.section,
  bl.code,
  bl.name,
  bl.revised_budget,
  COALESCE(dl.prior_to_date, 0) as prior_to_date,
  COALESCE(dl.this_period, 0) as this_period,
  COALESCE(dl.to_date_after, 0) as to_date,
  (bl.revised_budget - COALESCE(dl.to_date_after, 0)) as remaining,
  CASE
    WHEN bl.revised_budget > 0
      THEN ROUND(100 * COALESCE(dl.to_date_after, 0) / bl.revised_budget, 1)
    ELSE 0
  END as percent_complete
FROM draws d
JOIN construction_packages p ON p.id = d.package_id
JOIN budget_lines bl ON bl.package_id = p.id
LEFT JOIN draw_lines dl
  ON dl.draw_id = d.id
  AND dl.budget_line_id = bl.id
ORDER BY bl.section, bl.code;