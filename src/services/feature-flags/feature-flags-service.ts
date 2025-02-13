
import { pseudoId } from '@common';
import { FeatureFlagsService } from '@curiouslearning/features';

export const featureFlagService = new FeatureFlagsService({ userId: pseudoId || null });
