export type AnalyticsEventName = 'home_search_submitted' | 'apply_attempted';

export type AnalyticsEventPayload = Record<string, string | number | boolean | null | undefined>;
