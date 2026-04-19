'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useRazorpay } from '@/hooks/useRazorpay'
import { Plan } from '@/types'

const EXTRA_DEVICE_PRICE_DISPLAY = '₹199'

export default function PricingPage() {
  const { subscriptionStatus, user } = useAuth()
  const { initiatePayment, purchaseExtraDevice, isLoading } = useRazorpay()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/subscriptions/plans')
      .then(r => r.json())
      .then(data => { if (data.success) setPlans(data.data.plans) })
  }, [])

  const handleSubscribe = async (planName: string) => {
    setLoadingPlan(planName)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await initiatePayment(planName)
      setSuccessMsg('🎉 Subscription activated successfully! Enjoy full access.')
    } catch (err: any) {
      if (err.message !== 'Payment cancelled') {
        setErrorMsg(err.message || 'Payment failed. Please try again.')
      }
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleExtraDevice = async () => {
    setLoadingPlan('device')
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await purchaseExtraDevice()
      setSuccessMsg('✓ Extra device slot added to your account!')
    } catch (err: any) {
      if (err.message !== 'Payment cancelled') {
        setErrorMsg(err.message || 'Payment failed. Please try again.')
      }
    } finally {
      setLoadingPlan(null)
    }
  }

  const formatPrice = (paise: number) =>
    `₹${(paise / 100).toLocaleString('en-IN')}`

  const planHighlight: Record<string, boolean> = { quarterly: true }

  return (
    <AppLayout>
      <div className="p-4 sm:px-8 sm:py-8 pt-16 max-w-5xl">
        {/* Header */}
        <div className="mb-8 animate-in text-center">
          <h1 className="font-display font-700 text-3xl text-surface-900 mb-2">
            Choose Your Plan
          </h1>
          <p className="text-surface-500">
            {subscriptionStatus?.isTrialing
              ? `Your free trial ends in ${subscriptionStatus.daysRemaining} day(s). Upgrade to keep access.`
              : subscriptionStatus?.isSubscribed
              ? `You're subscribed! ${subscriptionStatus.daysRemaining} days remaining.`
              : 'Your trial has expired. Subscribe to continue using the calculator.'}
          </p>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm text-center animate-in">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center animate-in">
            {errorMsg}
          </div>
        )}

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-10 animate-in stagger-1">
          {plans.map(plan => {
            const isHighlighted = planHighlight[plan.name]
            const isCurrentPlan = subscriptionStatus?.isSubscribed &&
              user?.subscription?.plan === plan.name

            return (
              <div
                key={plan.id}
                className={`card p-6 relative transition-all duration-200 ${
                  isHighlighted
                    ? 'border-2 border-brand-400 shadow-brand ring-1 ring-brand-200'
                    : 'hover:shadow-card-hover'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-brand">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="font-display font-700 text-xl text-surface-900">{plan.displayName}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display font-700 text-3xl text-surface-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-surface-400 text-sm">
                      / {plan.durationDays} days
                    </span>
                  </div>
                  <p className="text-xs text-surface-400 mt-1">
                    ≈ {formatPrice(Math.round(plan.price / plan.durationDays * 30))}/month
                  </p>
                </div>

                <div className="space-y-2.5 mb-6">
                  {(plan.features as string[]).map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-surface-600">
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>

                {isCurrentPlan ? (
                  <div className="w-full text-center py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200">
                    ✓ Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={!!loadingPlan}
                    className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isHighlighted
                        ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-brand disabled:opacity-50'
                        : 'border border-surface-200 text-surface-700 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50'
                    }`}
                  >
                    {loadingPlan === plan.name ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Opening payment…
                      </span>
                    ) : 'Subscribe Now'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Extra Device section */}
        {subscriptionStatus?.isSubscribed && (
          <div className="card p-6 animate-in stagger-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-display font-600 text-lg text-surface-900 mb-1">
                  Need more device slots?
                </h3>
                <p className="text-surface-500 text-sm">
                  Add one extra device slot to your current subscription for {EXTRA_DEVICE_PRICE_DISPLAY}.
                  Available to active subscribers only.
                </p>
              </div>
              <button
                onClick={handleExtraDevice}
                disabled={!!loadingPlan}
                className="btn-outline text-sm py-2.5 px-6 flex-shrink-0"
              >
                {loadingPlan === 'device' ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing…
                  </span>
                ) : `Add Device Slot — ${EXTRA_DEVICE_PRICE_DISPLAY}`}
              </button>
            </div>
          </div>
        )}

        {/* Payment note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-surface-400">
            Secured by Razorpay · UPI, Cards, Net Banking accepted · All prices include GST ·
            Cancel anytime
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
