import { Category } from '../enums';

export interface Player {
  nickname: string;
  position: number;
  wedges: Category[];
  isHuman: boolean;
  mustLeaveHub: boolean;
}
