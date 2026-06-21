/**
 * Zustand store for multi-step assessment wizard state.
 */
import { create } from 'zustand'
import type {
  EnergyStep,
  FoodStep,
  ShoppingStep,
  TransportStep,
  WasteStep,
} from '@/api/types'

interface AssessmentState {
  currentStep: number
  transport: Partial<TransportStep>
  energy: Partial<EnergyStep>
  food: Partial<FoodStep>
  shopping: Partial<ShoppingStep>
  waste: Partial<WasteStep>
  isSubmitting: boolean

  setStep: (step: number) => void
  setTransport: (data: Partial<TransportStep>) => void
  setEnergy: (data: Partial<EnergyStep>) => void
  setFood: (data: Partial<FoodStep>) => void
  setShopping: (data: Partial<ShoppingStep>) => void
  setWaste: (data: Partial<WasteStep>) => void
  setSubmitting: (val: boolean) => void
  reset: () => void
}

const initialState = {
  currentStep: 0,
  transport: {
    daily_distance_km: undefined,
    vehicle_type: '',
    fuel_type: 'none',
    public_transport_days_per_week: 0,
  },
  energy: {
    monthly_electricity_kwh: undefined,
    daily_ac_hours: 0,
    renewable_energy: '',
  },
  food: {
    diet_type: '',
    weekly_meat_meals: 0,
  },
  shopping: {
    monthly_online_purchases: 0,
    monthly_new_clothing: 0,
  },
  waste: {
    recycling_habit: '',
    weekly_waste_kg: 0,
  },
  isSubmitting: false,
}

export const useAssessmentStore = create<AssessmentState>()((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  setTransport: (data) =>
    set((state) => ({ transport: { ...state.transport, ...data } })),
  setEnergy: (data) =>
    set((state) => ({ energy: { ...state.energy, ...data } })),
  setFood: (data) =>
    set((state) => ({ food: { ...state.food, ...data } })),
  setShopping: (data) =>
    set((state) => ({ shopping: { ...state.shopping, ...data } })),
  setWaste: (data) =>
    set((state) => ({ waste: { ...state.waste, ...data } })),
  setSubmitting: (val) => set({ isSubmitting: val }),
  reset: () => set(initialState),
}))
