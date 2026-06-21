/**
 * Type definitions for all API request/response shapes.
 * Mirrors the Pydantic schemas from the backend.
 */

export interface User {
  id: number
  email: string
  name: string
  age: number | null
  city: string | null
  household_size: number | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Assessment {
  id: number
  user_id: number
  daily_distance_km: number | null
  vehicle_type: string | null
  fuel_type: string | null
  public_transport_days_per_week: number | null
  monthly_electricity_kwh: number | null
  daily_ac_hours: number | null
  renewable_energy: string | null
  diet_type: string | null
  weekly_meat_meals: number | null
  monthly_online_purchases: number | null
  monthly_new_clothing: number | null
  recycling_habit: string | null
  weekly_waste_kg: number | null
  transport_emissions_monthly: number | null
  energy_emissions_monthly: number | null
  food_emissions_monthly: number | null
  shopping_emissions_monthly: number | null
  waste_emissions_monthly: number | null
  total_monthly: number | null
  total_annual: number | null
  sustainability_score: number | null
  is_complete: boolean
  created_at: string
  updated_at: string
}

export interface Recommendation {
  id: number
  category: string
  title: string
  description: string
  impact_kg_monthly: number
  created_at: string
}

export interface Challenge {
  id: number
  title: string
  description: string
  category: string
  duration_days: number
  estimated_co2_saving_kg: number
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatResponse {
  user_message: ChatMessage
  assistant_message: ChatMessage
  tools_called: string[]  // Which agentic tools Claude called
}

export interface BenchmarkData {
  india_average_monthly: number
  global_average_monthly: number
  category_india_averages: Record<string, number>
}

export interface ProgressEntry {
  id: number
  month_year: string
  total_monthly: number
  sustainability_score: number
  transport_emissions: number | null
  energy_emissions: number | null
  food_emissions: number | null
  shopping_emissions: number | null
  waste_emissions: number | null
  created_at: string
}

export interface DashboardData {
  user: User
  latest_assessment: Assessment | null
  recommendations: Recommendation[]
  active_challenges: Challenge[]
  benchmarks: BenchmarkData
  progress_history: Array<{
    month_year: string
    total_monthly: number
    sustainability_score: number
    transport: number | null
    energy: number | null
    food: number | null
    shopping: number | null
    waste: number | null
  }>
  badges: string[]
  cumulative_co2_saved: number
}

export interface ProgressData {
  entries: ProgressEntry[]
  cumulative_co2_saved: number
  completed_challenges: Challenge[]
  badges: string[]
  total_assessments: number
}

// Assessment wizard step types
export interface TransportStep {
  daily_distance_km: number
  vehicle_type: string
  fuel_type: string
  public_transport_days_per_week: number
}

export interface EnergyStep {
  monthly_electricity_kwh: number
  daily_ac_hours: number
  renewable_energy: string
}

export interface FoodStep {
  diet_type: string
  weekly_meat_meals: number
}

export interface ShoppingStep {
  monthly_online_purchases: number
  monthly_new_clothing: number
}

export interface WasteStep {
  recycling_habit: string
  weekly_waste_kg: number
}

export interface ProfileUpdate {
  name?: string
  age?: number
  city?: string
  household_size?: number
}
