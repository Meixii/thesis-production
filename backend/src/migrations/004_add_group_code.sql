-- Add group_code column to groups table
ALTER TABLE groups ADD COLUMN group_code VARCHAR(10) UNIQUE NOT NULL;

-- Add group_code to existing groups (for development)
UPDATE groups SET group_code = 'ZEN' || id::text WHERE group_code IS NULL;

-- Create function to generate random group code
CREATE OR REPLACE FUNCTION generate_group_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.group_code IS NULL THEN
    NEW.group_code = UPPER(
      SUBSTRING(
        MD5(NEW.group_name || NOW()::text),
        1,
        6
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate group code
CREATE TRIGGER before_group_insert
  BEFORE INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION generate_group_code(); 