import { create } from 'zustand';
import type {
  Lot, Recipe, SpcMeasurement, SpcViolation, SecsEvent, FaultConfig,
  AiRecommendation, Notification, Equipment,
  AiRecommendationEngineConfig, ConfidenceSnapshot,
} from '@/lib/mes-types';
import { MOCK_LOTS, MOCK_RECIPES } from '@/lib/mes-mock-data';

interface MesSpcState {
  lots: Lot[];
  recipes: Recipe[];
  activeLotId: string | null;
  activeRecipeId: string | null;
  waferNumber: number;
  equipmentState: 'idle' | 'processing' | 'inhibited';
  activeFault: FaultConfig | null;
  measurements: SpcMeasurement[];
  violations: SpcViolation[];
  events: SecsEvent[];

  // ai slice
  recommendations: AiRecommendation[];
  addRecommendation: (r: AiRecommendation) => void;
  applyRecommendation: (id: string) => void;
  overrideRecommendation: (id: string) => void;
  updateRecommendationConfidence: (id: string, confidence: number) => void;
  supersedeRecommendation: (supersededId: string, newRecId: string) => void;
  clearStaleRecommendations: (maxAgeMs?: number) => void;
  aiEngineConfig: AiRecommendationEngineConfig;
  setAiEngineConfig: (patch: Partial<AiRecommendationEngineConfig>) => void;
  lastAnalysisTimestamp: number | null;
  setLastAnalysisTimestamp: (ts: number) => void;

  // ui slice
  notifications: Notification[];
  isNotificationPanelOpen: boolean;
  isSettingsPanelOpen: boolean;
  isUserDropdownOpen: boolean;
  settings: { refreshInterval: number; showAnimations: boolean; compactMode: boolean };
  toggleNotificationPanel: () => void;
  toggleSettingsPanel: () => void;
  toggleUserDropdown: () => void;
  closeAllPanels: () => void;
  addNotification: (n: Notification) => void;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateSettings: (patch: Partial<MesSpcState['settings']>) => void;

  // equipment slice
  equipments: Equipment[];
  selectedEquipmentId: string | null;
  setSelectedEquipment: (id: string | null) => void;

  updateLot: (lotId: string, patch: Partial<Lot>) => void;
  startProcessing: (lotId: string, recipeId: string) => void;
  stopProcessing: () => void;
  addMeasurement: (m: SpcMeasurement) => void;
  addViolation: (v: SpcViolation) => void;
  acknowledgeViolation: (violationId: string) => void;
  resumeEquipment: () => void;
  addEvent: (e: SecsEvent) => void;
  injectFault: (fault: FaultConfig) => void;
  clearFault: () => void;
  incrementWafer: () => void;
}

export const INITIAL_MES_SPC_STATE: Omit<MesSpcState,
  | 'updateLot' | 'startProcessing' | 'stopProcessing'
  | 'addMeasurement' | 'addViolation' | 'acknowledgeViolation'
  | 'resumeEquipment' | 'addEvent' | 'injectFault' | 'clearFault'
  | 'incrementWafer'
  | 'addRecommendation' | 'applyRecommendation' | 'overrideRecommendation'
  | 'updateRecommendationConfidence' | 'supersedeRecommendation' | 'clearStaleRecommendations'
  | 'setAiEngineConfig' | 'setLastAnalysisTimestamp'
  | 'toggleNotificationPanel' | 'toggleSettingsPanel' | 'toggleUserDropdown'
  | 'closeAllPanels' | 'addNotification' | 'dismissNotification'
  | 'markAllNotificationsRead' | 'updateSettings' | 'setSelectedEquipment'
> = {
  lots: MOCK_LOTS,
  recipes: MOCK_RECIPES,
  activeLotId: null,
  activeRecipeId: null,
  waferNumber: 1,
  equipmentState: 'idle',
  activeFault: null,
  measurements: [],
  violations: [],
  events: [],
  recommendations: [],
  notifications: [],
  isNotificationPanelOpen: false,
  isSettingsPanelOpen: false,
  isUserDropdownOpen: false,
  settings: { refreshInterval: 2000, showAnimations: true, compactMode: false },
  equipments: [],
  selectedEquipmentId: null,
  aiEngineConfig: {
    driftThreshold: 0.3,
    minDataPoints: 5,
    confidenceDecayRate: 0.5,
    maxRecommendations: 10,
    analysisInterval: 3,
  },
  lastAnalysisTimestamp: null,
};

export const useMesSpcStore = create<MesSpcState>((set) => ({
  ...INITIAL_MES_SPC_STATE,

  updateLot: (lotId, patch) =>
    set((s) => ({ lots: s.lots.map((l) => l.id === lotId ? { ...l, ...patch } : l) })),

  startProcessing: (lotId, recipeId) =>
    set({ activeLotId: lotId, activeRecipeId: recipeId, equipmentState: 'processing', waferNumber: 1 }),

  stopProcessing: () =>
    set({ equipmentState: 'idle' }),

  addMeasurement: (m) =>
    set((s) => ({ measurements: [...s.measurements, m] })),

  addViolation: (v) =>
    set((s) => ({
      violations: [...s.violations, v],
      equipmentState: 'inhibited' as const,
    })),

  acknowledgeViolation: (violationId) =>
    set((s) => ({
      violations: s.violations.map((v) =>
        v.id === violationId ? { ...v, acknowledged: true } : v
      ),
      equipmentState: 'processing' as const,
    })),

  resumeEquipment: () =>
    set({ equipmentState: 'processing', activeFault: null }),

  addEvent: (e) =>
    set((s) => ({
      events: [e, ...s.events].slice(0, 100),
    })),

  injectFault: (fault) =>
    set({ activeFault: fault }),

  clearFault: () =>
    set({ activeFault: null }),

  incrementWafer: () =>
    set((s) => ({ waferNumber: s.waferNumber + 1 })),

  addRecommendation: (r) => set((s) => {
    if (s.recommendations.length >= s.aiEngineConfig.maxRecommendations) {
      return s; // Don't exceed max
    }
    return { recommendations: [...s.recommendations, r] };
  }),
  applyRecommendation: (id) => set((s) => ({ recommendations: s.recommendations.map(r => r.id === id ? { ...r, status: 'applied' as const } : r) })),
  overrideRecommendation: (id) => set((s) => ({ recommendations: s.recommendations.map(r => r.id === id ? { ...r, status: 'overridden' as const } : r) })),
  updateRecommendationConfidence: (id, confidence) => set((s) => ({
    recommendations: s.recommendations.map(r => {
      if (r.id !== id) return r;
      const snapshot: ConfidenceSnapshot = { timestamp: new Date(), confidence };
      return {
        ...r,
        confidence,
        confidenceHistory: [...r.confidenceHistory, snapshot].slice(-20),
      };
    }),
  })),
  supersedeRecommendation: (supersededId, newRecId) => set((s) => ({
    recommendations: s.recommendations.map(r =>
      r.id === supersededId ? { ...r, status: 'superseded' as const, supersededById: newRecId } : r
    ),
  })),
  clearStaleRecommendations: (maxAgeMs = 3600000) => set((s) => ({
    recommendations: s.recommendations.filter(r => {
      const age = Date.now() - r.createdAt.getTime();
      return r.status === 'pending' || age < maxAgeMs;
    }),
  })),
  setAiEngineConfig: (patch) => set((s) => ({ aiEngineConfig: { ...s.aiEngineConfig, ...patch } })),
  setLastAnalysisTimestamp: (ts) => set({ lastAnalysisTimestamp: ts }),
  toggleNotificationPanel: () => set((s) => ({ isNotificationPanelOpen: !s.isNotificationPanelOpen, isSettingsPanelOpen: false, isUserDropdownOpen: false })),
  toggleSettingsPanel: () => set((s) => ({ isSettingsPanelOpen: !s.isSettingsPanelOpen, isNotificationPanelOpen: false, isUserDropdownOpen: false })),
  toggleUserDropdown: () => set((s) => ({ isUserDropdownOpen: !s.isUserDropdownOpen, isNotificationPanelOpen: false, isSettingsPanelOpen: false })),
  closeAllPanels: () => set({ isNotificationPanelOpen: false, isSettingsPanelOpen: false, isUserDropdownOpen: false }),
  addNotification: (n) => set((s) => ({ notifications: [...s.notifications, n] })),
  dismissNotification: (id) => set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) })),
  markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  setSelectedEquipment: (id) => set({ selectedEquipmentId: id }),
}));
