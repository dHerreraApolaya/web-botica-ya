import users from '../data/users.mock.json';
import { createMockUserAdapter } from '../data/mockUser.adapter';
import { createUserFacade } from './user.facade';
import type { UserAccessFacade } from '../domain/User';

export const userAccessFacade: UserAccessFacade = createUserFacade(createMockUserAdapter(users));
