# Lovable promotions and referrals audit v1

Date: 2026-10-21. Source brief: `brief/project.json` v107. This is source analysis, not evidence that a live payment or payout service works.

## What the export contains

- `src/pages/DashboardPromoCodes.tsx` and `src/hooks/usePromoCodes.ts` let an organizer create, toggle, and delete percentage or fixed discount codes. The form supports an optional event, expiration, minimum order, and maximum uses. The hook calls Supabase directly. The migration `supabase/migrations/20260308191727_cf36eeb0-61ca-497b-a83b-1acb4122ce3d.sql` stores those fields and has a `validate_promo_code` function.
- `src/pages/EventDetail.tsx` sends a selected code and client-computed order amount to the validation hook. `src/hooks/useCheckout.ts` accepts item prices and a discount amount from the client, then inserts an order. Non-cash methods are marked confirmed without a verified processor response. A buyer can change those client values. The promo usage call sits after an early return when tickets are created, so common ticket purchases do not increment usage.
- `src/components/dashboard/AffiliatesManager.tsx` and `src/hooks/useAffiliates.ts` manage named affiliates, codes, a commission percentage, and displayed totals. The source migration `supabase/migrations/20260308203637_4e4492cf-d86d-4009-a177-284cee78e092.sql` stores affiliate rows. The UI creates a root `/?ref=CODE` link. The inspected checkout hook has no verified referral attribution or payout transaction. Affiliate totals in the UI do not establish earned or paid rewards.

## Current clickatick boundary

`lib/integrated-phase-a4-demo.mjs` prices each ticket from `public_tiers.price_minor` in the server transaction. The demo quote computes 10% of the undiscounted subtotal, stores an immutable quote JSON response, and charges zero. The demo receipt copies the quote amounts and explicitly says it is not admission. A2 event drafts already hold `referrals.enabled` and `percentageBasisPoints` up to 9,000. A4 public detail projects the setting but does not attribute a code or pay a reward. A6 event versions make old quotes stale after a published edit. New promotions must preserve these boundaries.

## Translation decisions from approved owner answers

The clickatick fee is 10% of **discounted ticket price**, rounded to cents. The organizer-set referral percentage also uses **discounted ticket price**, and its illustrated reward comes from the organizer share after the platform fee. No provider processing fee allocation is approved. Promo and referral codes are different: a promo lowers buyer ticket price; a referral attributes a buyer to a promoter. The current demo has neither a real purchase nor a payout, so it must not increment sales, accrue cash payable, reserve stock, or claim delivery.

## Gaps and risks

The source does not prove payment verification, atomic promo redemption, refund reversal, event-completion payout, self-referral prevention, or an email/identity mechanism for a customer promoter. Its public promo read policy exposes active codes, so do not copy it. The source accepts floating point currency, which can disagree at cent boundaries. Discount applicability to add-ons and processing fees is not approved; ticket-only discounts are the narrow translation. The public listing has no approved real payment provider, so any promotion remains a demo estimate until a payment contract is settled.
