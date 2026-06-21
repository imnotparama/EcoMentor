import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Zap, Leaf, ShoppingBag, Trash2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { assessmentApi } from '@/api/assessment'
import { useAssessmentStore } from '@/store/assessmentStore'
import { motion } from 'framer-motion'
import { formatError } from '@/utils/formatError'

const STEPS = [
  { id: 'transport', label: 'Transport', icon: Car, color: '#58A6FF' },
  { id: 'energy', label: 'Energy', icon: Zap, color: '#D29922' },
  { id: 'food', label: 'Food', icon: Leaf, color: '#3FB950' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#BC8CFF' },
  { id: 'waste', label: 'Waste', icon: Trash2, color: '#F85149' },
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="step-indicator" style={{ padding: '0 1rem', marginBottom: '2rem' }}>
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const isCompleted = i < currentStep
        const isActive = i === currentStep
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div
              className={`step-dot ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              aria-current={isActive ? 'step' : undefined}
              title={step.label}
            >
              {isCompleted ? <CheckCircle2 size={14} /> : <Icon size={13} />}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${isCompleted ? 'completed' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step Components ──────────────────────────────

function TransportStep() {
  const { transport, setTransport } = useAssessmentStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="daily-distance" className="form-label">Daily travel distance (km)</label>
        <input
          id="daily-distance"
          type="number"
          className="form-input"
          min={0}
          max={2000}
          placeholder="e.g. 15"
          value={transport.daily_distance_km ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setTransport({ daily_distance_km: val === '' ? undefined : (parseFloat(val) ?? 0) });
          }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Primary vehicle</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
          {[
            { value: 'car', label: '🚗 Car' },
            { value: 'bike', label: '🏍️ Motorbike' },
            { value: 'ev', label: '⚡ EV' },
            { value: 'public_transport', label: '🚌 Public Transit' },
            { value: 'none', label: '🚶 Walk/Cycle' },
          ].map(({ value, label }) => (
            <label
              key={value}
              className={`option-card ${transport.vehicle_type === value ? 'selected' : ''}`}
              style={{ cursor: 'pointer', justifyContent: 'center', textAlign: 'center' }}
            >
              <input
                type="radio"
                name="vehicle_type"
                value={value}
                checked={transport.vehicle_type === value}
                onChange={() => setTransport({ vehicle_type: value })}
              />
              <span style={{ fontSize: '0.85rem' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="fuel-type" className="form-label">Fuel type</label>
        <select
          id="fuel-type"
          className="form-select"
          value={transport.fuel_type ?? ''}
          onChange={(e) => setTransport({ fuel_type: e.target.value })}
        >
          <option value="">Select fuel type</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="electric">Electric</option>
          <option value="hybrid">Hybrid</option>
          <option value="none">N/A</option>
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="pt-days" className="form-label">
          Days per week using public transport: <strong style={{ color: 'var(--accent)' }}>{transport.public_transport_days_per_week ?? 0}</strong>
        </label>
        <input
          id="pt-days"
          type="range"
          min={0}
          max={7}
          step={1}
          value={transport.public_transport_days_per_week ?? 0}
          onChange={(e) => setTransport({ public_transport_days_per_week: parseInt(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>0 days</span><span>7 days</span>
        </div>
      </div>
    </div>
  )
}

function EnergyStep() {
  const { energy, setEnergy } = useAssessmentStore()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="electricity-kwh" className="form-label">Monthly electricity consumption (kWh)</label>
        <input
          id="electricity-kwh"
          type="number"
          className="form-input"
          min={0}
          placeholder="e.g. 150"
          value={energy.monthly_electricity_kwh ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setEnergy({ monthly_electricity_kwh: val === '' ? undefined : (parseFloat(val) ?? 0) });
          }}
        />
        <span className="form-hint">Check your electricity bill (usually in kWh or units)</span>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="ac-hours" className="form-label">
          Daily AC usage (hours): <strong style={{ color: 'var(--warning)' }}>{energy.daily_ac_hours ?? 0}h</strong>
        </label>
        <input
          id="ac-hours"
          type="range"
          min={0}
          max={24}
          step={0.5}
          value={energy.daily_ac_hours ?? 0}
          onChange={(e) => setEnergy({ daily_ac_hours: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--warning)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>0h</span><span>24h</span>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Renewable energy usage</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { value: 'yes', label: '☀️ Yes — solar panels or green energy plan', subtext: '70% emission reduction' },
            { value: 'partial', label: '⚡ Partial — some renewable sources', subtext: '40% emission reduction' },
            { value: 'no', label: '🏭 No — standard grid electricity', subtext: 'India grid: 0.82 kg CO₂/kWh' },
          ].map(({ value, label, subtext }) => (
            <label
              key={value}
              className={`option-card ${energy.renewable_energy === value ? 'selected' : ''}`}
              style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <input
                type="radio"
                name="renewable"
                value={value}
                checked={energy.renewable_energy === value}
                onChange={() => setEnergy({ renewable_energy: value })}
              />
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{label}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtext}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function FoodStep() {
  const { food, setFood } = useAssessmentStore()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Diet type</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { value: 'vegan', label: '🌱 Vegan', desc: '~1.5 kg CO₂/day', color: '#3FB950' },
            { value: 'vegetarian', label: '🥚 Vegetarian', desc: '~2.5 kg CO₂/day', color: '#58A6FF' },
            { value: 'mixed', label: '🍗 Mixed (occasional meat)', desc: '~4.0 kg CO₂/day', color: '#D29922' },
            { value: 'meat_heavy', label: '🥩 Meat-heavy', desc: '~7.5 kg CO₂/day', color: '#F85149' },
          ].map(({ value, label, desc, color }) => (
            <label
              key={value}
              className={`option-card ${food.diet_type === value ? 'selected' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="diet"
                value={value}
                checked={food.diet_type === value}
                onChange={() => setFood({ diet_type: value })}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{label}</div>
              </div>
              <span style={{ fontSize: '0.75rem', color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{desc}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="meat-meals" className="form-label">
          Weekly meat/poultry meals: <strong style={{ color: 'var(--warning)' }}>{food.weekly_meat_meals ?? 0}</strong>
        </label>
        <input
          id="meat-meals"
          type="range"
          min={0}
          max={21}
          step={1}
          value={food.weekly_meat_meals ?? 0}
          onChange={(e) => setFood({ weekly_meat_meals: parseInt(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--warning)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>0 meals</span><span>21 meals (3/day)</span>
        </div>
      </div>
    </div>
  )
}

function ShoppingStep() {
  const { shopping, setShopping } = useAssessmentStore()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="online-purchases" className="form-label">
          Monthly online purchases (orders): <strong style={{ color: 'var(--accent)' }}>{shopping.monthly_online_purchases ?? 0}</strong>
        </label>
        <input
          id="online-purchases"
          type="range"
          min={0}
          max={50}
          step={1}
          value={shopping.monthly_online_purchases ?? 0}
          onChange={(e) => setShopping({ monthly_online_purchases: parseInt(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>0 orders</span><span>50+ orders</span>
        </div>
        <span className="form-hint">Each delivery: ~0.5 kg CO₂ (last-mile delivery)</span>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="clothing-items" className="form-label">
          Monthly new clothing items: <strong style={{ color: '#BC8CFF' }}>{shopping.monthly_new_clothing ?? 0}</strong>
        </label>
        <input
          id="clothing-items"
          type="range"
          min={0}
          max={20}
          step={1}
          value={shopping.monthly_new_clothing ?? 0}
          onChange={(e) => setShopping({ monthly_new_clothing: parseInt(e.target.value) })}
          style={{ width: '100%', accentColor: '#BC8CFF' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>0 items</span><span>20+ items</span>
        </div>
        <span className="form-hint">Each new clothing item: ~10 kg CO₂ (lifecycle)</span>
      </div>
    </div>
  )
}

function WasteStep() {
  const { waste, setWaste } = useAssessmentStore()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Recycling habit</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { value: 'always', label: '♻️ Always recycle', desc: '70% waste diverted from landfill' },
            { value: 'sometimes', label: '🔄 Sometimes recycle', desc: '30% waste diverted from landfill' },
            { value: 'never', label: '🗑️ Rarely/never recycle', desc: 'Most waste goes to landfill' },
          ].map(({ value, label, desc }) => (
            <label
              key={value}
              className={`option-card ${waste.recycling_habit === value ? 'selected' : ''}`}
              style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <input
                type="radio"
                name="recycling"
                value={value}
                checked={waste.recycling_habit === value}
                onChange={() => setWaste({ recycling_habit: value })}
              />
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{label}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="weekly-waste" className="form-label">
          Approximate weekly waste (kg): <strong style={{ color: 'var(--danger)' }}>{waste.weekly_waste_kg ?? 0} kg</strong>
        </label>
        <input
          id="weekly-waste"
          type="range"
          min={0}
          max={50}
          step={0.5}
          value={waste.weekly_waste_kg ?? 0}
          onChange={(e) => setWaste({ weekly_waste_kg: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--danger)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>0 kg</span><span>50 kg</span>
        </div>
        <span className="form-hint">India average household: ~5-10 kg/week</span>
      </div>
    </div>
  )
}


const StepComponents = [TransportStep, EnergyStep, FoodStep, ShoppingStep, WasteStep]

export default function Assessment() {
  const { currentStep, setStep, transport, energy, food, shopping, waste, setSubmitting, isSubmitting, reset } = useAssessmentStore()
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Carbon Assessment — EcoMentor AI'
  }, [])

  const currentStepData = STEPS[currentStep]
  const StepComponent = StepComponents[currentStep]

  const handleNext = async () => {
    setIsSaving(true)
    setError(null)
    try {
      // Save current step data
      const stepKey = currentStepData.id
      
      if (stepKey === 'transport' && !transport.vehicle_type) {
        setError('Please select a primary vehicle type.')
        setIsSaving(false)
        return
      }
      if (stepKey === 'energy' && !energy.renewable_energy) {
        setError('Please select a renewable energy usage option.')
        setIsSaving(false)
        return
      }
      if (stepKey === 'food' && !food.diet_type) {
        setError('Please select a diet type.')
        setIsSaving(false)
        return
      }
      if (stepKey === 'waste' && !waste.recycling_habit) {
        setError('Please select a recycling habit.')
        setIsSaving(false)
        return
      }

      const stepData: Record<string, unknown> = {}

      if (stepKey === 'transport') {
        stepData.transport = {
          ...transport,
          daily_distance_km: transport.daily_distance_km ?? 0,
        }
      } else if (stepKey === 'energy') {
        stepData.energy = {
          ...energy,
          monthly_electricity_kwh: energy.monthly_electricity_kwh ?? 0,
        }
      } else if (stepKey === 'food') {
        stepData.food = food
      } else if (stepKey === 'shopping') {
        stepData.shopping = shopping
      } else if (stepKey === 'waste') {
        stepData.waste = waste
      }

      await assessmentApi.saveStep(stepData as Parameters<typeof assessmentApi.saveStep>[0])

      if (currentStep < STEPS.length - 1) {
        setStep(currentStep + 1)
      } else {
        // Complete assessment
        setSubmitting(true)
        await assessmentApi.complete()
        reset()
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      setError(formatError(err, 'Failed to save. Please check your inputs.'))
    } finally {
      setIsSaving(false)
      setSubmitting(false)
    }
  }

  const isLastStep = currentStep === STEPS.length - 1

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Carbon Footprint Assessment</h1>
          <p style={{ fontSize: '0.875rem' }}>Step {currentStep + 1} of {STEPS.length}: {currentStepData.label}</p>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Step card */}
        <div style={{
          background: 'var(--surface)',
          border: `1px solid ${currentStepData.color}30`,
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-md)',
        }}>
          {/* Step header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${currentStepData.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <currentStepData.icon size={22} color={currentStepData.color} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem' }}>
                {currentStepData.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {{
                  transport: 'How do you get around?',
                  energy: 'Home energy usage',
                  food: 'What do you eat?',
                  shopping: 'Consumption habits',
                  waste: 'Waste management',
                }[currentStepData.id]}
              </div>
            </div>
          </div>

          <StepComponent />

          {error && (
            <div role="alert" style={{
              background: 'var(--danger-dim)', borderRadius: 'var(--radius-md)',
              padding: '0.75rem', fontSize: '0.875rem', color: 'var(--danger)',
              marginTop: '1rem',
            }}>
              {error}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
            {currentStep > 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => setStep(currentStep - 1)}
                disabled={isSaving}
                aria-label="Go to previous step"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary"
              onClick={handleNext}
              disabled={isSaving || isSubmitting}
              style={{ flex: 1 }}
              id={isLastStep ? 'btn-complete-assessment' : 'btn-next-step'}
              aria-label={isLastStep ? 'Complete assessment and calculate your footprint' : 'Save and continue to next step'}
            >
              {isSaving || isSubmitting ? (
                <span className="spinner" style={{ width: 18, height: 18 }} />
              ) : (
                <>
                  {isLastStep ? 'Calculate My Footprint 🌍' : 'Save & Continue'}
                  {!isLastStep && <ArrowRight size={16} />}
                </>
              )}
            </motion.button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          Progress is auto-saved. You can resume at any time.
        </p>
      </div>
    </div>
  )
}
