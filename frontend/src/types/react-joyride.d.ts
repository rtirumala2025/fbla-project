/**
 * Type declarations for react-joyride
 * Fixes TypeScript module resolution issues
 */
declare module 'react-joyride' {
  import { Component, ReactNode } from 'react';

  export interface Step {
    target?: string | HTMLElement;
    content: ReactNode;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';
    disableBeacon?: boolean;
    spotlightClicks?: boolean;
    [key: string]: any;
  }

  export interface CallBackProps {
    action: string;
    index: number;
    status: string;
    type: string;
    [key: string]: any;
  }

  export const STATUS: {
    READY: string;
    RUNNING: string;
    PAUSED: string;
    FINISHED: string;
    SKIPPED: string;
    ERROR: string;
  };

  export const EVENTS: {
    TOUR_START: string;
    STEP_BEFORE: string;
    BEACON: string;
    TOOLTIP: string;
    STEP_AFTER: string;
    TOUR_END: string;
    TOUR_STATUS: string;
    TARGET_NOT_FOUND: string;
    ERROR: string;
  };

  export const ACTIONS: {
    START: string;
    NEXT: string;
    PREV: string;
    PAUSE: string;
    RESUME: string;
    STOP: string;
    RESET: string;
    UPDATE: string;
    CLOSE: string;
    SKIP: string;
  };

  export interface JoyrideProps {
    steps: Step[];
    run?: boolean;
    continuous?: boolean;
    scrollToFirstStep?: boolean;
    showProgress?: boolean;
    showSkipButton?: boolean;
    callback?: (data: CallBackProps) => void;
    styles?: any;
    locale?: any;
    [key: string]: any;
  }

  export default class Joyride extends Component<JoyrideProps> {}
}

