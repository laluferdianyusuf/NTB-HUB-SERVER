export type ServiceConfig = {
  sections?: {
    schedule?: boolean;
    units?: boolean;
    menu?: boolean;
  };

  durationStepMinutes?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;

  sessions?: Array<{
    id: string;
    label: string;
    start: string;
    end: string;
    price?: number;
    quota?: number;
  }>;
};
