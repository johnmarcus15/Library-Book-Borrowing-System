import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate.js';
import * as c from '../controllers/adminController.js';
const r = Router();
r.use(authenticate, authorize('ADMIN')); // every admin route: session + ADMIN role, enforced server-side
r.get('/dashboard', c.dashboard);
r.get('/users', c.users);
r.get('/users/:id', c.userDetail);
r.patch('/users/:id/status', c.statusRules, c.setStatus);
r.get('/borrowings', c.borrowings);
r.post('/borrowings', c.issueRules, c.issue);
r.get('/reports', c.reports);
export default r;
