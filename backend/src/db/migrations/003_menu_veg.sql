-- Explicit vegetarian flag on menu items (replaces name-based heuristic in the UI).
ALTER TABLE menu_items ADD COLUMN is_veg INTEGER NOT NULL DEFAULT 1;
