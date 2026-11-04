import { httpUserAdapter } from '../data/httpUser.adapter';
import { createUserFacade } from './user.facade';
import type { UserAccessFacade } from '../domain/User';

export const userAccessFacade: UserAccessFacade = createUserFacade(httpUserAdapter);
