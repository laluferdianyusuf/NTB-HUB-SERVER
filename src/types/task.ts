interface RewardRule {
  points: number;
}

interface BaseTaskRule {
  reward?: RewardRule;
}

interface QrTaskRule extends BaseTaskRule {}

interface GeoTaskRule extends BaseTaskRule {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

interface LocationQrTaskRule extends BaseTaskRule {
  location: {
    latitude: number;
    longitude: number;
  };
  radiusMeters: number;
}

export type TaskRule = BaseTaskRule &
  Partial<GeoTaskRule> &
  Partial<LocationQrTaskRule>;
