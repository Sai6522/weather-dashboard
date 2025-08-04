declare module 'react-range' {
  import { ReactNode } from 'react';

  export interface ITrackProps {
    props: any;
    children: ReactNode;
  }

  export interface IThumbProps {
    props: any;
    index?: number;
  }

  export interface IRangeProps {
    step: number;
    min: number;
    max: number;
    values: number[];
    onChange: (values: number[]) => void;
    renderTrack: (params: ITrackProps) => ReactNode;
    renderThumb: (params: IThumbProps) => ReactNode;
  }

  export const Range: React.FC<IRangeProps>;
}
