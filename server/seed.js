/**
 * seed.js - Populate database with demo data
 */

const { initDatabase, run, get, all, insert } = require('./db');
const bcrypt = require('bcryptjs');

// Hash password (simple for demo)
function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

async function seedDatabase() {
    console.log('Initializing database...');
    await initDatabase();

    console.log('Seeding database...');

    // Clear existing data
    run('DELETE FROM prescriptions');
    run('DELETE FROM appointments');
    run('DELETE FROM patients');
    run('DELETE FROM doctors');

    // Reset auto-increment counters
    run("DELETE FROM sqlite_sequence WHERE name='prescriptions'");
    run("DELETE FROM sqlite_sequence WHERE name='appointments'");
    run("DELETE FROM sqlite_sequence WHERE name='patients'");
    run("DELETE FROM sqlite_sequence WHERE name='doctors'");

    // ===== SEED DOCTORS =====
    const doctors = [
        ['fatima.rizwan@medassist.com', hashPassword('doctor123'), 'Dr. Fatima Rizwan', 'General Physician', 4.8, '12 years', 'doctor1.png'],
        ['usman.ali@medassist.com', hashPassword('doctor123'), 'Dr. Usman Ali', 'Cardiologist', 4.9, '20 years', 'doctor2.png'],
        ['zainab.bashir@medassist.com', hashPassword('doctor123'), 'Dr. Zainab Bashir', 'Dermatologist', 4.7, '8 years', 'doctor3.png'],
        ['bilal.malik@medassist.com', hashPassword('doctor123'), 'Dr. Bilal Malik', 'Pediatrician', 4.9, '15 years', 'doctor4.png'],
        ['sadia.pervez@medassist.com', hashPassword('doctor123'), 'Dr. Sadia Pervez', 'Neurologist', 4.8, '18 years', 'doctor5.png'],
        ['faisal.mahmood@medassist.com', hashPassword('doctor123'), 'Dr. Faisal Mahmood', 'General Physician', 4.6, '5 years', 'doctor6.png']
    ];

    doctors.forEach(doc => {
        run(`INSERT INTO doctors (email, password_hash, full_name, specialty, rating, experience, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`, doc);
    });
    console.log(`Inserted ${doctors.length} doctors`);

    // ===== SEED PATIENTS =====
    const patients = [
        [
            'sharique.baig@email.com',
            hashPassword('patient123'),
            'Sharique Baig',
            '+92-300-1234567',
            '1985-03-15',
            'male',
            'Patient has history of recurring migraines, typically stress-induced. Mild hypertension noted (BP 130/85). Last visit on 2024-12-15: consulted for skin rash on forearms, diagnosed as contact dermatitis. Recommended topical corticosteroid.'
        ],
        [
            'maira.aijaz@email.com',
            hashPassword('patient123'),
            'Maira Aijaz',
            '+92-300-7654321',
            '1990-07-22',
            'female',
            'Seasonal allergies (spring/fall). Visited on 2024-11-20 for persistent eczema on hands - referred to dermatology. Follow-up showed improvement with prescribed moisturizing regimen.'
        ],
        [
            'mohammad.suffiyan@email.com',
            hashPassword('patient123'),
            'Mohammad Suffiyan',
            '+92-300-1122334',
            '1978-11-08',
            'male',
            'Visit 1 (2024-10-05): Reported mild chest discomfort during exercise. ECG recommended, results normal. Visit 2 (2024-12-01): Follow-up, symptoms resolved. Continue monitoring.'
        ],
        [
            'ayisha.siddiqui@email.com',
            hashPassword('patient123'),
            'Ayisha Siddiqui',
            '+92-300-5566778',
            '1995-01-30',
            'female',
            'First visit on 2025-01-02: General checkup. No major concerns. Vitals normal. Recommended annual flu vaccine.'
        ],
        [
            'zeeshan.arshad@email.com',
            hashPassword('patient123'),
            'Zeeshan Arshad',
            '+92-300-9988776',
            '1982-09-14',
            'male',
            '' // New patient, no history
        ]
    ];

    patients.forEach(pat => {
        run(`INSERT INTO patients (email, password_hash, full_name, phone, date_of_birth, gender, medical_history) VALUES (?, ?, ?, ?, ?, ?, ?)`, pat);
    });
    console.log(`Inserted ${patients.length} patients`);

    // ===== SEED APPOINTMENTS =====
    const appointments = [
        // John Doe - 3 past appointments
        [1, 1, '2024-11-10 10:00:00', 'completed',
            'Patient: I have been having headaches for 3 days\nAI: How severe is the pain on a scale of 1-10?\nPatient: About 7, throbbing pain\nAI: Any sensitivity to light or nausea?\nPatient: Yes, bright lights bother me',
            'Symptoms: Throbbing headache, photosensitivity. Duration: 3 days. Severity: 7/10. Suspected: Migraine. Recommended: Consult General Physician.'
        ],
        [1, 3, '2024-12-15 14:30:00', 'completed',
            'Patient: I have a rash on my forearms\nAI: How long have you had this rash?\nPatient: About a week\nAI: Any new soaps or detergents?\nPatient: Yes, switched laundry detergent recently',
            'Symptoms: Red, itchy rash on forearms. Duration: 1 week. Trigger: New laundry detergent. Suspected: Contact dermatitis. Referred to Dermatologist.'
        ],
        [1, 1, '2025-01-05 09:00:00', 'completed',
            'Patient: Follow up on my blood pressure\nAI: Have you been monitoring at home?\nPatient: Yes, averaging 125/82\nAI: Thats an improvement from last time',
            'Follow-up visit. BP improved to 125/82 (previously 130/85). Continue current lifestyle modifications. Next check in 3 months.'
        ],
        // Jane Smith - 2 appointments
        [2, 1, '2024-11-20 11:00:00', 'completed',
            'Patient: I have dry, itchy patches on my hands\nAI: How long has this been going on?\nPatient: Several months, worse in winter\nAI: Any triggers you have noticed?\nPatient: Gets worse when I wash dishes',
            'Symptoms: Chronic dry, itchy skin on hands. Duration: Several months. Worsens with water exposure. Suspected: Eczema. Referred to Dermatology.'
        ],
        [2, 3, '2024-12-20 15:00:00', 'completed',
            'Patient: Following up on my eczema\nAI: How is the moisturizing regimen working?\nPatient: Much better, less flaking\nAI: Great, continue the current treatment',
            'Follow-up: Eczema improving with prescribed emollient therapy. Continue current regimen. Use gloves when washing dishes.'
        ],
        // Alex Kumar - 2 appointments
        [3, 2, '2024-10-05 10:30:00', 'completed',
            'Patient: I feel some discomfort in my chest when I exercise\nAI: Can you describe the sensation?\nPatient: Like pressure, lasts a few minutes\nAI: Any shortness of breath or dizziness?\nPatient: Sometimes a little short of breath',
            'Symptoms: Chest pressure during exertion, mild dyspnea. Duration: 2 weeks. Recommended: ECG and stress test. Referred to Cardiologist.'
        ],
        [3, 2, '2024-12-01 09:30:00', 'completed',
            'Patient: Coming for my follow-up, ECG was normal\nAI: Any recent symptoms?\nPatient: No, feeling much better\nAI: Excellent, the tests were reassuring',
            'Follow-up: ECG and stress test normal. Symptoms resolved. Likely exercise-induced anxiety. Continue regular exercise, monitor symptoms.'
        ],
        // Maria Garcia - 1 appointment
        [4, 1, '2025-01-02 16:00:00', 'completed',
            'Patient: Just here for a general checkup\nAI: Any specific concerns?\nPatient: No, just routine\nAI: When was your last physical?\nPatient: About a year ago',
            'General checkup. No acute concerns. Vitals within normal limits. Recommended: Annual flu vaccine, routine bloodwork.'
        ]
    ];

    appointments.forEach(appt => {
        run(`INSERT INTO appointments (patient_id, doctor_id, appointment_time, status, chat_history, ai_summary) VALUES (?, ?, ?, ?, ?, ?)`, appt);
    });
    console.log(`Inserted ${appointments.length} appointments`);

    // ===== SEED PRESCRIPTIONS =====
    const prescriptions = [
        [1, 1, 1, 'Sumatriptan', '50mg as needed', 'Take at onset of migraine. Max 2 doses per day.', 'active'],
        [1, 3, 2, 'Hydrocortisone Cream 1%', 'Apply twice daily', 'Apply thin layer to affected areas for 7 days.', 'completed'],
        [2, 3, 5, 'CeraVe Moisturizing Cream', 'Apply liberally', 'Use after washing hands and before bed.', 'active'],
        [4, 1, 8, 'Vitamin D3', '1000 IU daily', 'Take with food. Routine supplementation.', 'active']
    ];

    prescriptions.forEach(rx => {
        run(`INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, medicine, dosage, notes, refill_status) VALUES (?, ?, ?, ?, ?, ?, ?)`, rx);
    });
    console.log(`Inserted ${prescriptions.length} prescriptions`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('   Doctors: any email above with password "doctor123"');
    console.log('   Patients: any email above with password "patient123"');
}

// Run seeder if executed directly
if (require.main === module) {
    seedDatabase().catch(err => {
        console.error('Seeding failed:', err);
        process.exit(1);
    });
}

module.exports = { seedDatabase };
