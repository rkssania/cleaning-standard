import { Subject, SubjectId } from '../types';
import { biology } from './biology';
import { chemistry } from './chemistry';
import { cs } from './cs';
import { esl } from './esl';
import { geography } from './geography';
import { kazakh } from './kazakh';
import { kzhistory } from './kzhistory';
import { math } from './math';
import { physics } from './physics';
import { rulanguage } from './rulanguage';
import { ruliterature } from './ruliterature';
import { worldhistory } from './worldhistory';

export const SUBJECTS: Record<SubjectId, Subject> = {
  kazakh, chemistry, math, kzhistory, geography, esl,
  physics, cs, ruliterature, worldhistory, rulanguage, biology,
};

export const isSubjectId = (id: string | undefined): id is SubjectId => !!id && id in SUBJECTS;
