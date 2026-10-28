import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Borrowing from '../models/Borrowing.js';
import { env } from '../config/env.js';

const DAY = 86400000;
const B = (title, author, isbn, category, year, copies, description) => ({
  title, author, isbn, category, publicationYear: year, totalCopies: copies, description
});

export const defaultBooks = [
  B('Introduction to Algorithms', 'Thomas H. Cormen', '9780262046305', 'Computer Science', 2022, 4, 'Comprehensive reference on algorithms and data structures.'),
  B('Clean Code', 'Robert C. Martin', '9780132350884', 'Software Engineering', 2008, 3, 'A handbook of agile software craftsmanship.'),
  B('Database System Concepts', 'Abraham Silberschatz', '9780078022159', 'Computer Science', 2019, 3, 'Core concepts of database design and systems.'),
  B('Computer Networks', 'Andrew S. Tanenbaum', '9780132126953', 'Networking', 2010, 2, 'Layered approach to modern computer networks.'),
  B('Operating System Concepts', 'Abraham Silberschatz', '9781119800361', 'Computer Science', 2021, 3, 'Principles of operating systems.'),
  B('The Pragmatic Programmer', 'Andrew Hunt', '9780135957059', 'Software Engineering', 2019, 2, 'Practical advice for working developers.'),
  B('Engineering Mathematics', 'K. A. Stroud', '9781352010275', 'Mathematics', 2020, 5, 'Foundation mathematics for engineering students covering calculus, algebra, and differential equations.'),
  B('Higher Engineering Mathematics', 'B. S. Grewal', '9788174091955', 'Mathematics', 2021, 6, 'Standard reference textbook for undergraduate engineering mathematics and transforms.'),
  B('Discrete Mathematics and Its Applications', 'Kenneth H. Rosen', '9781259676512', 'Mathematics', 2018, 4, 'Discrete structures, set theory, combinatorics, and graph theory for computing.'),
  B('Linear Algebra and Its Applications', 'Gilbert Strang', '9780030105678', 'Mathematics', 2016, 3, 'Vector spaces, eigenvalues, matrix decompositions, and linear transformations.'),
  B('Probability and Statistics for Engineers', 'Ronald E. Walpole', '9780321629111', 'Mathematics', 2017, 3, 'Probability theory, distributions, statistical inference, and hypothesis testing.'),
  B('Artificial Intelligence: A Modern Approach', 'Stuart Russell & Peter Norvig', '9780134610993', 'Artificial Intelligence', 2020, 4, 'The definitive guide to theory and practice of modern AI systems.'),
  B('Deep Learning', 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', '9780262035613', 'Artificial Intelligence', 2016, 3, 'Foundations of neural networks, backpropagation, and deep generative models.'),
  B('Pattern Recognition and Machine Learning', 'Christopher M. Bishop', '9780387310732', 'Machine Learning', 2013, 3, 'Comprehensive introduction to probabilistic machine learning algorithms.'),
  B('Cloud Computing: Principles and Paradigms', 'Rajkumar Buyya', '9780470887998', 'Cloud Computing', 2019, 4, 'Architecture, virtualization, data centers, and cloud infrastructure management.'),
  B('Computer Organization and Architecture', 'William Stallings', '9780134997193', 'Computer Science', 2022, 3, 'Internal structure and operation of modern digital computer processors and memory hierarchy.'),
  B('Compilers: Principles, Techniques, and Tools', 'Alfred V. Aho', '9780321486813', 'Computer Science', 2014, 2, 'The classic dragon book on lexical analysis, parsing, code generation, and optimization.'),
  B('Web Development with Node and Express', 'Ethan Brown', '9781491949306', 'Web Development', 2019, 4, 'Building robust server-side full stack web applications and REST APIs.'),
  B('Designing Data-Intensive Applications', 'Martin Kleppmann', '9781449373320', 'Software Engineering', 2017, 3, 'Principles behind reliable, scalable, and maintainable distributed data systems.'),
  B('Cybersecurity Essentials', 'Charles J. Brooks', '9781119362395', 'Cybersecurity', 2018, 3, 'Fundamental security concepts, threat defense, encryption, and network defense strategies.'),
  B('Modern Software Engineering', 'David Farley', '9780137314911', 'Software Engineering', 2021, 3, 'Doing what works to build better software faster.'),
  B('Wings of Fire', 'A. P. J. Abdul Kalam', '9788173711466', 'Biography', 1999, 4, 'Autobiography of the missile scientist and former President of India Dr. A.P.J. Abdul Kalam.')
];

export async function seedDatabase() {
  // 1. Seed Books
  let booksInserted = 0;
  for (const b of defaultBooks) {
    const res = await Book.updateOne(
      { isbn: b.isbn },
      { $setOnInsert: { ...b, availableCopies: b.totalCopies } },
      { upsert: true }
    );
    if (res.upsertedCount > 0) booksInserted++;
  }

  // 2. Seed Default Admin Account
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminStrongPass#2026';
  const adminName = process.env.ADMIN_NAME || 'Head Librarian';
  const adminStudentId = process.env.ADMIN_STUDENT_ID || 'ADMIN001';

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: adminName,
      email: adminEmail,
      studentId: adminStudentId,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'ADMIN',
      isActive: true,
    });
  }

  // 3. Seed Sample Members
  const memberPassword = process.env.SEED_PASSWORD || 'DevOnly#12345';
  const memberHash = await bcrypt.hash(memberPassword, 10);
  const members = [];
  for (let i = 1; i <= 3; i++) {
    const email = `member${i}@example.com`;
    await User.updateOne(
      { email },
      {
        $setOnInsert: {
          name: `Sample Member ${i}`,
          email,
          studentId: `DEV000${i}`,
          passwordHash: memberHash,
          role: 'MEMBER',
          isActive: true,
        }
      },
      { upsert: true }
    );
    members.push(await User.findOne({ email }));
  }

  // 4. Seed Sample Borrowings (if none exist)
  const existingBorrowings = await Borrowing.countDocuments();
  if (existingBorrowings === 0 && members.length > 0) {
    const dbBooks = await Book.find({ isbn: { $in: defaultBooks.map((b) => b.isbn) } }).sort('isbn');
    if (dbBooks.length >= 4) {
      const plan = [
        [0, 0, 3, null],
        [1, 1, 30, null],
        [2, 2, 25, 15],
        [0, 3, 2, null]
      ];
      for (const [m, k, ago, ret] of plan) {
        const user = members[m], book = dbBooks[k];
        if (!user || !book) continue;
        const borrowedAt = new Date(Date.now() - ago * DAY);
        const dueDate = new Date(borrowedAt.getTime() + (env.rules.loanDays || 14) * DAY);
        await Borrowing.create({
          user: user._id,
          book: book._id,
          borrowedAt,
          dueDate,
          ...(ret ? { status: 'RETURNED', returnedAt: new Date(Date.now() - ret * DAY) } : {})
        });
        if (!ret) {
          await Book.updateOne({ _id: book._id }, { $inc: { availableCopies: -1 } });
        }
      }
    }
  }

  const totalBooks = await Book.countDocuments();
  const totalUsers = await User.countDocuments();

  return {
    success: true,
    message: 'Database seeded successfully',
    stats: { totalBooks, totalUsers, booksInserted },
    demoAccounts: {
      admin: { email: adminEmail, password: adminPassword, role: 'ADMIN' },
      member: { email: 'member1@example.com', password: memberPassword, role: 'MEMBER' },
    }
  };
}
