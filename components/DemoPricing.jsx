import {pricingLines} from './promotions-ui.mjs';

const dollars=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format((value||0)/100);

export default function DemoPricing({pricing,subtotalMinor,terms}){
 return <><dl className="demo-pricing">{pricingLines(pricing,subtotalMinor).map(line=><div key={line.label}><dt>{line.label}</dt><dd>{dollars(line.amountMinor)}</dd></div>)}<div><dt>Amount charged</dt><dd>$0.00</dd></div></dl>{terms?.promotion&&<p>Promotion {terms.promotion.code} is included in this demo price.</p>}{terms?.referral&&<p>Referral code {terms.referral.code} is recorded for this demo. No reward is earned or paid.</p>}</>;
}
