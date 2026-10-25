require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const PASSWORD = 'ali1234';

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  // Allow multiple students from the same institute (RegistrationNo stored institute name)
  try {
    await pool.query('ALTER TABLE student DROP INDEX RegistrationNo');
    console.log('Dropped UNIQUE index on RegistrationNo');
  } catch (e) {
    if (e.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log('RegistrationNo index already removed');
    } else {
      throw e;
    }
  }

  const [aliIot] = await pool.query(
    'SELECT StudentID FROM student WHERE LOWER(TRIM(Email)) IN (?, ?)',
    ['ali@iot.edu', 'ali@iout.edu']
  );

  if (aliIot.length > 0) {
    await pool.query(
      `UPDATE student SET Email = ?, Password = ?, Name = 'Ali'
       WHERE LOWER(TRIM(Email)) IN ('ali@iot.edu', 'ali@iout.edu')`,
      ['ali@iout.edu', hash]
    );
    console.log('Updated existing Ali student -> ali@iout.edu / ali1234');
  } else {
    await pool.query(
      'INSERT INTO student (Name, Email, Password, ContactNo, RegistrationNo) VALUES (?, ?, ?, ?, ?)',
      ['Ali', 'ali@iout.edu', hash, '03001234567', 'Institute of Technology (IoT)']
    );
    console.log('Created Ali student -> ali@iout.edu / ali1234');
  }

  const [legacy] = await pool.query(
    'SELECT id FROM users WHERE LOWER(TRIM(email)) IN (?, ?)',
    ['ali@iot.edu', 'ali@iout.edu']
  );

  if (legacy.length > 0) {
    await pool.query(
      `UPDATE users SET email = ?, password_hash = ?, name = 'Ali', institute = 'Institute of Technology (IoT)'
       WHERE LOWER(TRIM(email)) IN ('ali@iot.edu', 'ali@iout.edu')`,
      ['ali@iout.edu', hash]
    );
    console.log('Updated legacy users row for ali@iout.edu');
  } else {
    try {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, phone, institute, role, created_at)
         VALUES (?, ?, ?, ?, ?, 'student', NOW())`,
        ['Ali', 'ali@iout.edu', hash, '03001234567', 'Institute of Technology (IoT)']
      );
      console.log('Created legacy users row for ali@iout.edu');
    } catch (e) {
      console.log('users insert note:', e.message);
    }
  }

  const [check] = await pool.query(
    'SELECT StudentID, Email, Password FROM student WHERE LOWER(TRIM(Email)) = ?',
    ['ali@iout.edu']
  );
  const ok = check.length && (await bcrypt.compare(PASSWORD, check[0].Password));
  console.log('Verify ali@iout.edu + ali1234:', ok ? 'OK' : 'FAILED');
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
