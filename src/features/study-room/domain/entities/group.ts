export interface Group {
  id: string;
  name: string;
  bananaThreshold: number;
  eggplantThreshold: number;
  maxEggplantsAllowed: number;
  telegramTopicLink?: string | null;
  createdAt: Date;
}
