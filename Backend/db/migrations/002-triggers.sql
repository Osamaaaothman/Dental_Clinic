CREATE OR REPLACE FUNCTION create_teeth_for_patient()
RETURNS TRIGGER AS $$
DECLARE
  fdi_numbers INT[] := ARRAY[
    11,12,13,14,15,16,17,18,
    21,22,23,24,25,26,27,28,
    31,32,33,34,35,36,37,38,
    41,42,43,44,45,46,47,48
  ];
  tooth_num INT;
BEGIN
  FOREACH tooth_num IN ARRAY fdi_numbers LOOP
    INSERT INTO teeth (patient_id, tooth_number, status)
    VALUES (NEW.id, tooth_num, 'unknown');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_patient_insert ON patients;

CREATE TRIGGER after_patient_insert
AFTER INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION create_teeth_for_patient();

CREATE OR REPLACE FUNCTION set_teeth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_teeth_update_set_timestamp ON teeth;

CREATE TRIGGER before_teeth_update_set_timestamp
BEFORE UPDATE ON teeth
FOR EACH ROW
EXECUTE FUNCTION set_teeth_updated_at();
