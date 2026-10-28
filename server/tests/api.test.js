// Integration tests. Require MongoDB and MONGODB_URI_TEST (separate test database).
import request from 'supertest';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { testEnv } from './helpers.js';

testEnv();
const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Book } = await import('../src/models/Book.js');
const { default: Borrowing } = await import('../src/models/Borrowing.js');
const DAY = 86400000;
const PW = 'Passw0rd!long';

beforeAll(() => mongoose.connect(process.env.MONGODB_URI));
afterAll(() => mongoose.disconnect());
beforeEach(async () => { await Promise.all([User.deleteMany({}), Book.deleteMany({}), Borrowing.deleteMany({})]); await Promise.all([User.init(), Book.init(), Borrowing.init()]); });

const mkUser = async (n, role = 'MEMBER') => User.create({ name: n, email: `${n}@t.com`, studentId: `S-${n}`, passwordHash: await bcrypt.hash(PW, 4), role });
const mkBook = (over = {}) => Book.create({ title: 'Book', author: 'A', category: 'CS', totalCopies: 1, availableCopies: 1, ...over });
const as = async (u) => { const a = request.agent(app); const r = await a.post('/api/auth/login').send({ email: u.email, password: PW }); expect(r.status).toBe(200); return a; };
const reg = { name: 'New', email: 'new@t.com', studentId: 'R1', password: PW, confirmPassword: PW };

describe('auth', () => {
  test('registers a member and hides the hash', async () => {
    const r = await request(app).post('/api/auth/register').send(reg);
    expect(r.status).toBe(201); expect(r.body.data.role).toBe('MEMBER'); expect(r.body.data.passwordHash).toBeUndefined();
    expect((await User.findOne({ email: 'new@t.com' }).select('+passwordHash')).passwordHash).not.toBe(PW);
  });
  test('rejects duplicate email / register number', async () => {
    await request(app).post('/api/auth/register').send(reg);
    expect((await request(app).post('/api/auth/register').send(reg)).status).toBe(409);
    expect((await request(app).post('/api/auth/register').send({ ...reg, email: 'other@t.com' })).status).toBe(409);
  });
  test('cannot self-register as admin', async () => {
    const r = await request(app).post('/api/auth/register').send({ ...reg, role: 'ADMIN' });
    expect(r.body.data.role).toBe('MEMBER');
  });
  test('login succeeds; wrong password and unknown user get the same error', async () => {
    const u = await mkUser('m1');
    const ok = await request(app).post('/api/auth/login').send({ email: u.email, password: PW });
    expect(ok.status).toBe(200); expect(ok.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    const bad = await request(app).post('/api/auth/login').send({ email: u.email, password: 'wrong-password' });
    const none = await request(app).post('/api/auth/login').send({ email: 'x@t.com', password: 'wrong-password' });
    expect(bad.status).toBe(401); expect(none.body.message).toBe(bad.body.message);
  });
  test('deactivated users cannot log in', async () => {
    const u = await mkUser('m1'); await User.updateOne({ _id: u._id }, { isActive: false });
    expect((await request(app).post('/api/auth/login').send({ email: u.email, password: PW })).status).toBe(401);
  });
});

describe('authorization', () => {
  test('unauthenticated requests are rejected', async () => {
    expect((await request(app).get('/api/borrowings/my')).status).toBe(401);
    expect((await request(app).post('/api/borrowings').send({})).status).toBe(401);
  });
  test('members cannot use admin endpoints or modify the catalogue', async () => {
    const m = await as(await mkUser('m1'));
    expect((await m.get('/api/admin/dashboard')).status).toBe(403);
    expect((await m.get('/api/admin/users')).status).toBe(403);
    expect((await m.post('/api/books').send({ title: 'x', author: 'y', category: 'z', totalCopies: 1 })).status).toBe(403);
  });
  test('admin can read the dashboard', async () => {
    const a = await as(await mkUser('adm', 'ADMIN'));
    const r = await a.get('/api/admin/dashboard'); expect(r.status).toBe(200); expect(r.body.data.totalTitles).toBe(0);
  });
});

describe('books', () => {
  test('admin creates a book; validation and duplicate ISBN are rejected', async () => {
    const a = await as(await mkUser('adm', 'ADMIN'));
    const body = { title: 'T', author: 'A', category: 'CS', totalCopies: 3, isbn: '9780132350884' };
    const ok = await a.post('/api/books').send(body);
    expect(ok.status).toBe(201); expect(ok.body.data.availableCopies).toBe(3);
    expect((await a.post('/api/books').send(body)).status).toBe(409);
    expect((await a.post('/api/books').send({ title: '', author: 'A', category: 'CS', totalCopies: -1 })).status).toBe(400);
  });
  test('public catalogue supports search and pagination', async () => {
    await mkBook({ title: 'Alpha' }); await mkBook({ title: 'Beta' });
    const r = await request(app).get('/api/books').query({ q: 'alp', limit: 1 });
    expect(r.body.data).toHaveLength(1); expect(r.body.pagination.total).toBe(1);
    expect((await request(app).get('/api/books').query({ q: { $ne: '' } })).status).toBe(200); // operator objects are ignored, not executed
  });
  test('book with active loan cannot be deleted', async () => {
    const a = await as(await mkUser('adm', 'ADMIN')); const m = await mkUser('m1'); const b = await mkBook();
    await Borrowing.create({ user: m._id, book: b._id, dueDate: new Date(Date.now() + DAY) });
    expect((await a.delete(`/api/books/${b._id}`)).status).toBe(409);
  });
});

describe('borrowing and returns', () => {
  test('member borrows a book; availability drops', async () => {
    const m = await as(await mkUser('m1')); const b = await mkBook({ totalCopies: 2, availableCopies: 2 });
    const r = await m.post('/api/borrowings').send({ bookId: String(b._id) });
    expect(r.status).toBe(201); expect((await Book.findById(b._id)).availableCopies).toBe(1);
    expect(new Date(r.body.data.dueDate) - Date.now()).toBeGreaterThan(13 * DAY);
  });
  test('cannot borrow when no copies remain', async () => {
    const m = await as(await mkUser('m1')); const b = await mkBook({ availableCopies: 0 });
    expect((await m.post('/api/borrowings').send({ bookId: String(b._id) })).status).toBe(409);
  });
  test('cannot borrow the same title twice', async () => {
    const m = await as(await mkUser('m1')); const b = await mkBook({ totalCopies: 3, availableCopies: 3 });
    await m.post('/api/borrowings').send({ bookId: String(b._id) });
    expect((await m.post('/api/borrowings').send({ bookId: String(b._id) })).status).toBe(409);
    expect((await Book.findById(b._id)).availableCopies).toBe(2);
  });
  test('enforces the maximum active borrowings (2 in tests)', async () => {
    const m = await as(await mkUser('m1')); const [b1, b2, b3] = await Promise.all([mkBook(), mkBook(), mkBook()]);
    await m.post('/api/borrowings').send({ bookId: String(b1._id) }); await m.post('/api/borrowings').send({ bookId: String(b2._id) });
    expect((await m.post('/api/borrowings').send({ bookId: String(b3._id) })).status).toBe(409);
  });
  test('simultaneous requests cannot over-allocate the last copy', async () => {
    const [u1, u2, u3] = [await mkUser('m1'), await mkUser('m2'), await mkUser('m3')]; const b = await mkBook();
    const agents = await Promise.all([as(u1), as(u2), as(u3)]);
    const res = await Promise.all(agents.map((a) => a.post('/api/borrowings').send({ bookId: String(b._id) })));
    expect(res.filter((r) => r.status === 201)).toHaveLength(1);
    expect((await Book.findById(b._id)).availableCopies).toBe(0);
  });
  test('return restores availability and a second return is rejected', async () => {
    const m = await as(await mkUser('m1')); const b = await mkBook();
    const { body } = await m.post('/api/borrowings').send({ bookId: String(b._id) });
    expect((await m.post(`/api/borrowings/${body.data._id}/return`)).status).toBe(200);
    expect((await Book.findById(b._id)).availableCopies).toBe(1);
    expect((await m.post(`/api/borrowings/${body.data._id}/return`)).status).toBe(409);
    expect((await Book.findById(b._id)).availableCopies).toBe(1);
  });
  test('overdue return records the fine (3 days x ₹5)', async () => {
    const u = await mkUser('m1'); const m = await as(u); const b = await mkBook({ availableCopies: 0 });
    const br = await Borrowing.create({ user: u._id, book: b._id, borrowedAt: new Date(Date.now() - 17 * DAY), dueDate: new Date(Date.now() - 2.5 * DAY) });
    const r = await m.post(`/api/borrowings/${br._id}/return`);
    expect(r.body.data.fineAmount).toBe(15);
  });
});

describe('privacy and admin operations', () => {
  test('members cannot read or return another member\'s borrowing', async () => {
    const u1 = await mkUser('m1'); const m2 = await as(await mkUser('m2')); const b = await mkBook();
    const br = await Borrowing.create({ user: u1._id, book: b._id, dueDate: new Date(Date.now() + DAY) });
    expect((await m2.get(`/api/borrowings/${br._id}`)).status).toBe(404);
    expect((await m2.post(`/api/borrowings/${br._id}/return`)).status).toBe(403);
    expect((await m2.get('/api/borrowings/my')).body.data).toHaveLength(0);
  });
  test('admin can view any borrowing and issue a book; deactivated members cannot borrow', async () => {
    const u = await mkUser('m1'); const a = await as(await mkUser('adm', 'ADMIN')); const b = await mkBook({ totalCopies: 2, availableCopies: 2 });
    expect((await a.post('/api/admin/borrowings').send({ userId: String(u._id), bookId: String(b._id) })).status).toBe(201);
    expect((await a.get('/api/admin/borrowings')).body.data).toHaveLength(1);
    expect((await a.patch(`/api/admin/users/${u._id}/status`).send({ isActive: false })).status).toBe(200);
    expect((await a.post('/api/admin/borrowings').send({ userId: String(u._id), bookId: String(b._id) })).status).toBe(403);
    expect(await Borrowing.countDocuments({ user: u._id })).toBe(1); // history preserved
  });
});
